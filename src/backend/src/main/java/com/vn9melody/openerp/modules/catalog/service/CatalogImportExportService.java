package com.vn9melody.openerp.modules.catalog.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiFieldError;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.CatalogRelationType;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.modules.catalog.api.CatalogResponseKey;
import com.vn9melody.openerp.modules.catalog.api.CatalogSupport;
import com.vn9melody.openerp.modules.catalog.dto.CatalogImportExportDtos.CsvFile;
import com.vn9melody.openerp.modules.catalog.dto.CatalogImportExportDtos.ImportAction;
import com.vn9melody.openerp.modules.catalog.dto.CatalogImportExportDtos.ImportReport;
import com.vn9melody.openerp.modules.catalog.dto.CatalogImportExportDtos.ImportRowError;
import com.vn9melody.openerp.modules.catalog.dto.CatalogImportExportDtos.ImportRowResult;
import com.vn9melody.openerp.modules.catalog.dto.CatalogItemDtos.EdgeCreateRequest;
import com.vn9melody.openerp.modules.catalog.dto.CatalogItemDtos.ItemCreateRequest;
import com.vn9melody.openerp.modules.catalog.dto.CatalogItemDtos.ItemResponse;
import com.vn9melody.openerp.modules.catalog.dto.CatalogItemDtos.ItemUpdateRequest;
import com.vn9melody.openerp.modules.catalog.model.CatalogItem;
import com.vn9melody.openerp.modules.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import com.vn9melody.openerp.modules.catalog.repository.CatalogItemEdgeRepository;
import com.vn9melody.openerp.modules.catalog.repository.CatalogItemRepository;
import com.vn9melody.openerp.modules.catalog.repository.CatalogTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PushbackReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Catalog import/export (TASK-390 / DES-API-S05-001 section 4.1).
 *
 * <p>Import matches rows by {@code code} inside one type: missing rows are
 * created (v1), existing rows are updated through {@link CatalogItemService}
 * (new version, old one closed), unchanged rows are skipped, and
 * {@code parent_code} creates HIERARCHY edges through {@link CatalogEdgeService}
 * after all items exist (so forward references work). Per-row business errors are
 * reported without blocking valid rows; the whole file is parsed and validated
 * before the first write, and {@code dry_run} performs no write at all. A tenant
 * importing a system {@code code} gets its own override row (TASK-391), never a
 * mutation of the system row.</p>
 *
 * <p>This service intentionally has no class-level transaction: each row is
 * committed by the item/edge services in its own transaction, which keeps one
 * failed row from poisoning the whole import (JTA rollback-only semantics).</p>
 */
@ApplicationScoped
public class CatalogImportExportService {

    static final String COL_CODE = "code";
    static final String COL_NAME = "name";
    static final String COL_PARENT_CODE = "parent_code";

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    private static final String IMPORT_TEMPLATE_HEADER = COL_CODE + "," + COL_NAME + "," + COL_PARENT_CODE + "\r\n";
    private static final String EXPORT_HEADER = "type_code,code,name,parent_code,status,valid_from,valid_to,version\r\n";
    /** Export-only columns accepted (and ignored) on import so an export round-trips. */
    private static final Set<String> IGNORED_COLUMNS = Set.of("type_code", "status", "valid_from", "valid_to",
        "version");

    @Inject
    CatalogItemService itemService;

    @Inject
    CatalogEdgeService edgeService;

    @Inject
    CatalogItemRepository itemRepository;

    @Inject
    CatalogItemEdgeRepository edgeRepository;

    @Inject
    CatalogTypeRepository typeRepository;

    @Inject
    CatalogPermissionGuard guard;

    @ConfigProperty(name = "openerp.catalog.import.max-rows", defaultValue = "20000")
    int maxRows;

    // ------------------------------------------------------------------
    // Import
    // ------------------------------------------------------------------

    public ImportReport importItems(UUID tenantId, String typeCode, String fileName, InputStream content,
                                    boolean dryRun) {
        CatalogType type = requireImportableType(tenantId, typeCode);
        List<ParsedRecord> records;
        try {
            records = isXlsx(fileName) ? parseXlsx(content) : parseCsv(content);
        } catch (ApiException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            throw validationFailed("file");
        }
        if (records.isEmpty()) {
            throw validationFailed("header");
        }
        Header header = parseHeader(records.get(0));
        List<RowInput> inputs = readRows(header, records, type.code);
        List<RowOutcome> outcomes = dryRun ? planRows(tenantId, type, inputs) : writeRows(tenantId, type, inputs);
        int edgesCreated = dryRun ? planEdges(tenantId, type, outcomes) : writeEdges(tenantId, type, outcomes);
        return buildReport(dryRun, inputs.size(), outcomes, edgesCreated);
    }

    private CatalogType requireImportableType(UUID tenantId, String typeCode) {
        CatalogType type = guard.requireVisibleType(tenantId, typeCode);
        // Mirrors CatalogItemService.create: tenant types need the can_write grant,
        // system types stay writable only as tenant override rows (TASK-391).
        if (tenantId != null && type.tenantId != null) {
            guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.WRITE);
        }
        return type;
    }

    private List<RowOutcome> writeRows(UUID tenantId, CatalogType type, List<RowInput> inputs) {
        List<RowOutcome> outcomes = new ArrayList<>();
        for (RowInput input : inputs) {
            RowOutcome outcome = new RowOutcome(input);
            if (!input.errors().isEmpty()) {
                outcome.action = ImportAction.ERROR;
                outcome.errors.addAll(input.errors());
                outcomes.add(outcome);
                continue;
            }
            CatalogItem current = itemRepository.findCurrentByCode(tenantId, type.id, input.code());
            if (current == null) {
                try {
                    ItemResponse created = itemService.create(tenantId, type.code,
                        new ItemCreateRequest(input.code(), input.name(), null, null, null, null, null));
                    outcome.action = ImportAction.CREATED;
                    outcome.itemId = created.id();
                } catch (ApiException e) {
                    outcome.action = ImportAction.ERROR;
                    outcome.errors.add(toFieldError(e));
                }
            } else if (input.name().equals(current.name)) {
                outcome.action = ImportAction.SKIPPED;
                outcome.itemId = current.id;
            } else {
                try {
                    ItemResponse updated = itemService.update(tenantId, current.id,
                        new ItemUpdateRequest(input.name(), null, null, null, null, null));
                    outcome.action = ImportAction.UPDATED;
                    outcome.itemId = updated.id();
                } catch (ApiException e) {
                    outcome.action = ImportAction.ERROR;
                    outcome.errors.add(toFieldError(e));
                }
            }
            outcomes.add(outcome);
        }
        return outcomes;
    }

    /** Dry-run twin of {@link #writeRows}: same decisions, no writes. */
    private List<RowOutcome> planRows(UUID tenantId, CatalogType type, List<RowInput> inputs) {
        Map<String, String> effectiveNames = new HashMap<>();
        List<RowOutcome> outcomes = new ArrayList<>();
        for (RowInput input : inputs) {
            RowOutcome outcome = new RowOutcome(input);
            if (!input.errors().isEmpty()) {
                outcome.action = ImportAction.ERROR;
                outcome.errors.addAll(input.errors());
                outcomes.add(outcome);
                continue;
            }
            String knownName = effectiveNames.get(input.code());
            if (knownName != null) {
                outcome.action = knownName.equals(input.name()) ? ImportAction.SKIPPED : ImportAction.UPDATED;
            } else {
                CatalogItem current = itemRepository.findCurrentByCode(tenantId, type.id, input.code());
                if (current == null) {
                    outcome.action = ImportAction.CREATED;
                } else {
                    outcome.itemId = current.id;
                    outcome.action = current.name.equals(input.name()) ? ImportAction.SKIPPED : ImportAction.UPDATED;
                }
            }
            effectiveNames.put(input.code(), input.name());
            outcomes.add(outcome);
        }
        return outcomes;
    }

    private int writeEdges(UUID tenantId, CatalogType type, List<RowOutcome> outcomes) {
        int created = 0;
        for (RowOutcome outcome : outcomes) {
            if (outcome.action == ImportAction.ERROR || outcome.input.parentCode() == null) {
                continue;
            }
            ApiFieldError issue = precheckEdge(tenantId, type, outcome);
            if (issue != null) {
                outcome.errors.add(issue);
                continue;
            }
            CatalogItem parent = itemRepository.findCurrentByCode(tenantId, type.id, outcome.input.parentCode());
            if (parent == null) {
                outcome.errors.add(rowInvalid(COL_PARENT_CODE));
                continue;
            }
            if (outcome.itemId == null) {
                continue;
            }
            if (edgeRepository.findActiveEdge(tenantId, parent.id, outcome.itemId,
                    CatalogRelationType.HIERARCHY) != null) {
                continue; // already linked: re-import is idempotent
            }
            if (edgeRepository.wouldCreateCycle(parent.id, outcome.itemId)) {
                outcome.errors.add(new ApiFieldError(COL_PARENT_CODE, CatalogErrorCode.CATALOG_EDGE_CYCLE,
                    Map.of(ResponseKey.PARENT_ID.getKey(), parent.id.toString(),
                        ResponseKey.ID.getKey(), outcome.itemId.toString())));
                continue;
            }
            try {
                edgeService.create(tenantId, new EdgeCreateRequest(parent.id.toString(),
                    outcome.itemId.toString(), CatalogRelationType.HIERARCHY.name(), null));
                created++;
            } catch (ApiException e) {
                outcome.errors.add(toFieldError(e));
            }
        }
        return created;
    }

    /** Dry-run twin of {@link #writeEdges}: same read-only checks, no writes. */
    private int planEdges(UUID tenantId, CatalogType type, List<RowOutcome> outcomes) {
        Set<String> fileCodes = new HashSet<>();
        for (RowOutcome outcome : outcomes) {
            if (outcome.action != ImportAction.ERROR) {
                fileCodes.add(outcome.input.code());
            }
        }
        Set<String> predicted = new HashSet<>();
        int created = 0;
        for (RowOutcome outcome : outcomes) {
            if (outcome.action == ImportAction.ERROR || outcome.input.parentCode() == null) {
                continue;
            }
            ApiFieldError issue = precheckEdge(tenantId, type, outcome);
            if (issue != null) {
                outcome.errors.add(issue);
                continue;
            }
            CatalogItem parent = itemRepository.findCurrentByCode(tenantId, type.id, outcome.input.parentCode());
            if (parent == null) {
                if (!fileCodes.contains(outcome.input.parentCode())) {
                    outcome.errors.add(rowInvalid(COL_PARENT_CODE));
                    continue;
                }
                // Parent row is created by this file; the write run links it.
                if (predicted.add(outcome.input.parentCode() + "|" + outcome.input.code())) {
                    created++;
                }
                continue;
            }
            if (outcome.itemId != null) {
                if (edgeRepository.findActiveEdge(tenantId, parent.id, outcome.itemId,
                        CatalogRelationType.HIERARCHY) != null) {
                    continue;
                }
                if (edgeRepository.wouldCreateCycle(parent.id, outcome.itemId)) {
                    outcome.errors.add(new ApiFieldError(COL_PARENT_CODE, CatalogErrorCode.CATALOG_EDGE_CYCLE,
                        Map.of(ResponseKey.PARENT_ID.getKey(), parent.id.toString(),
                            ResponseKey.ID.getKey(), outcome.itemId.toString())));
                    continue;
                }
                if (!predicted.add(parent.id + "|" + outcome.itemId)) {
                    continue;
                }
            } else if (!predicted.add(outcome.input.parentCode() + "|" + outcome.input.code())) {
                continue;
            }
            created++;
        }
        // ponytail: dry-run cannot simulate cycles among items created in the same
        // file (no ids yet); the write run still rejects them per row.
        return created;
    }

    /** Read-only edge checks shared by dry-run and write so both report the same errors. */
    private ApiFieldError precheckEdge(UUID tenantId, CatalogType type, RowOutcome outcome) {
        if (outcome.input.parentCode().equals(outcome.input.code())) {
            return rowInvalid(COL_PARENT_CODE);
        }
        if (tenantId != null && type.tenantId == null) {
            // Tenant override rows under a system type carry no parent edges.
            return new ApiFieldError(COL_PARENT_CODE, CatalogErrorCode.CATALOG_TYPE_FORBIDDEN,
                Map.of(ResponseKey.CODE.getKey(), type.code));
        }
        if (!CatalogPermissionGuard.contains(type.allowedRelations, CatalogRelationType.HIERARCHY.name())) {
            return new ApiFieldError(COL_PARENT_CODE, CatalogErrorCode.CATALOG_EDGE_RELATION_NOT_ALLOWED,
                Map.of(ResponseKey.CODE.getKey(), type.code));
        }
        return null;
    }

    private ImportReport buildReport(boolean dryRun, int totalRows, List<RowOutcome> outcomes, int edgesCreated) {
        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<ImportRowError> errors = new ArrayList<>();
        List<ImportRowResult> rows = new ArrayList<>();
        for (RowOutcome outcome : outcomes) {
            switch (outcome.action) {
                case CREATED -> created++;
                case UPDATED -> updated++;
                case SKIPPED -> skipped++;
                case ERROR -> {
                }
            }
            for (ApiFieldError error : outcome.errors) {
                errors.add(new ImportRowError(outcome.input.row(), error.getCode(), error.getParams()));
            }
            rows.add(new ImportRowResult(outcome.input.row(), outcome.action, outcome.input.code(),
                outcome.input.name(), outcome.errors));
        }
        return new ImportReport(dryRun, totalRows, created, updated, skipped, edgesCreated, errors, rows);
    }

    // ------------------------------------------------------------------
    // Template / export
    // ------------------------------------------------------------------

    public CsvFile template(UUID tenantId, String typeCode) {
        guard.requireTypeAccess(tenantId, typeCode, CatalogPermissionGuard.Access.READ);
        return new CsvFile(withBom(IMPORT_TEMPLATE_HEADER), "catalog-template-" + typeCode + ".csv");
    }

    public CsvFile export(UUID tenantId, String typeCode, boolean all, String asOfText, String q, String status,
                          String parentIdText, String relationType) {
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        UUID parentId = CatalogSupport.parseUuid(parentIdText, "parent_id");
        List<CatalogType> types = new ArrayList<>();
        if (all) {
            for (CatalogType type : typeRepository.listVisible(tenantId)) {
                if (guard.hasTypeAccess(tenantId, type, CatalogPermissionGuard.Access.READ)) {
                    types.add(type);
                }
            }
        } else {
            if (typeCode == null || typeCode.isBlank()) {
                throw CatalogSupport.validation(CatalogResponseKey.TYPE_CODE.getKey(), ErrorCode.VALIDATION_REQUIRED,
                    Map.of());
            }
            types.add(guard.requireTypeAccess(tenantId, typeCode, CatalogPermissionGuard.Access.READ));
        }

        StringBuilder csv = new StringBuilder(EXPORT_HEADER);
        for (CatalogType type : types) {
            List<CatalogItem> items = itemRepository.findItemsForExport(tenantId, type.id, asOf, q, status,
                parentId, relationType);
            Map<UUID, String> parentCodes = parentCodesByChild(tenantId, items, asOf);
            for (CatalogItem item : items) {
                appendExportRow(csv, type.code, item, parentCodes.get(item.id));
            }
        }
        return new CsvFile(withBom(csv.toString()), "catalog-export.csv");
    }

    private Map<UUID, String> parentCodesByChild(UUID tenantId, List<CatalogItem> items, Instant asOf) {
        if (items.isEmpty()) {
            return Map.of();
        }
        Map<UUID, UUID> parentByChild = new HashMap<>();
        List<UUID> childIds = items.stream().map(item -> item.id).toList();
        for (CatalogItemEdge edge : edgeRepository.listActiveByChildIds(childIds, tenantId, asOf)) {
            if (edge.relationType == CatalogRelationType.HIERARCHY) {
                parentByChild.putIfAbsent(edge.childItemId, edge.parentItemId);
            }
        }
        if (parentByChild.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> codeByParentId = new HashMap<>();
        for (CatalogItem parent : itemRepository.listVisibleByIds(tenantId,
                new LinkedHashSet<>(parentByChild.values()))) {
            codeByParentId.put(parent.id, parent.code);
        }
        Map<UUID, String> codes = new HashMap<>();
        parentByChild.forEach((childId, parentId) -> {
            String code = codeByParentId.get(parentId);
            if (code != null) {
                codes.put(childId, code);
            }
        });
        return codes;
    }

    private static void appendExportRow(StringBuilder csv, String typeCode, CatalogItem item, String parentCode) {
        csv.append(csv(typeCode)).append(',')
            .append(csv(item.code)).append(',')
            .append(csv(item.name)).append(',')
            .append(csv(parentCode)).append(',')
            .append(item.status.name()).append(',')
            .append(DateTimeFormatter.ISO_INSTANT.format(item.validFrom)).append(',')
            .append(item.validTo == null ? "" : DateTimeFormatter.ISO_INSTANT.format(item.validTo)).append(',')
            .append(item.version).append("\r\n");
    }

    // ------------------------------------------------------------------
    // Parsing
    // ------------------------------------------------------------------

    private static boolean isXlsx(String fileName) {
        return fileName != null && fileName.toLowerCase(Locale.ROOT).endsWith(".xlsx");
    }

    /**
     * RFC 4180 CSV reader (UTF-8, BOM tolerated, quoted fields with {@code ""}
     * escapes and embedded newlines). The row limit aborts parsing as soon as it
     * is exceeded so a hostile upload cannot exhaust memory.
     */
    private List<ParsedRecord> parseCsv(InputStream content) throws IOException {
        List<ParsedRecord> records = new ArrayList<>();
        try (PushbackReader reader = new PushbackReader(
                new InputStreamReader(content, StandardCharsets.UTF_8), 1)) {
            int first = reader.read();
            if (first != -1 && first != '\uFEFF') {
                reader.unread(first);
            }
            List<String> cells = new ArrayList<>();
            StringBuilder field = new StringBuilder();
            boolean quoted = false;
            boolean pending = false;
            int recordNumber = 1;
            int dataRows = 0;
            int current;
            while ((current = reader.read()) != -1) {
                char ch = (char) current;
                if (quoted) {
                    if (ch == '"') {
                        int next = reader.read();
                        if (next == '"') {
                            field.append('"');
                        } else {
                            quoted = false;
                            if (next != -1) {
                                reader.unread(next);
                            }
                        }
                    } else {
                        field.append(ch);
                    }
                } else if (ch == '"' && field.length() == 0) {
                    quoted = true;
                    pending = true;
                } else if (ch == ',') {
                    cells.add(field.toString());
                    field.setLength(0);
                    pending = true;
                } else if (ch == '\r' || ch == '\n') {
                    if (ch == '\r') {
                        int next = reader.read();
                        if (next != '\n' && next != -1) {
                            reader.unread(next);
                        }
                    }
                    cells.add(field.toString());
                    field.setLength(0);
                    ParsedRecord record = new ParsedRecord(recordNumber++, List.copyOf(cells));
                    records.add(record);
                    cells.clear();
                    pending = false;
                    dataRows = countDataRow(records, record, dataRows);
                } else {
                    field.append(ch);
                    pending = true;
                }
            }
            if (pending || field.length() > 0 || !cells.isEmpty()) {
                cells.add(field.toString());
                ParsedRecord record = new ParsedRecord(recordNumber, List.copyOf(cells));
                records.add(record);
                countDataRow(records, record, dataRows);
            }
        }
        return records;
    }

    private int countDataRow(List<ParsedRecord> records, ParsedRecord record, int dataRows) {
        if (records.size() > 1 && !isBlank(record.cells())) {
            dataRows++;
            if (dataRows > maxRows) {
                throw tooLarge();
            }
        }
        return dataRows;
    }

    /** First sheet of an .xlsx workbook; row numbers stay 1-based sheet rows. */
    private List<ParsedRecord> parseXlsx(InputStream content) throws IOException {
        List<ParsedRecord> records = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(content)) {
            if (workbook.getNumberOfSheets() == 0) {
                return records;
            }
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            int dataRows = 0;
            for (int rowIndex = sheet.getFirstRowNum(); rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                List<String> cells = new ArrayList<>();
                if (row != null) {
                    for (int cellIndex = 0; cellIndex < row.getLastCellNum(); cellIndex++) {
                        Cell cell = row.getCell(cellIndex);
                        cells.add(cell == null ? "" : formatter.formatCellValue(cell));
                    }
                }
                ParsedRecord record = new ParsedRecord(rowIndex + 1, List.copyOf(cells));
                records.add(record);
                dataRows = countDataRow(records, record, dataRows);
            }
        }
        return records;
    }

    private static Header parseHeader(ParsedRecord record) {
        List<String> cells = new ArrayList<>();
        for (String cell : record.cells()) {
            cells.add(cell == null ? "" : cell.trim().toLowerCase(Locale.ROOT));
        }
        int codeIndex = -1;
        int nameIndex = -1;
        int parentIndex = -1;
        int typeCodeIndex = -1;
        for (int i = 0; i < cells.size(); i++) {
            String column = cells.get(i);
            switch (column) {
                case COL_CODE -> codeIndex = duplicate(codeIndex, i);
                case COL_NAME -> nameIndex = duplicate(nameIndex, i);
                case COL_PARENT_CODE -> parentIndex = duplicate(parentIndex, i);
                case "type_code" -> typeCodeIndex = duplicate(typeCodeIndex, i);
                default -> {
                    if (!column.isEmpty() && !IGNORED_COLUMNS.contains(column)) {
                        throw validationFailed("header");
                    }
                }
            }
        }
        if (codeIndex < 0 || nameIndex < 0) {
            throw validationFailed("header");
        }
        return new Header(cells.size(), codeIndex, nameIndex, parentIndex, typeCodeIndex);
    }

    private static int duplicate(int current, int index) {
        if (current >= 0) {
            throw validationFailed("header");
        }
        return index;
    }

    private List<RowInput> readRows(Header header, List<ParsedRecord> records, String typeCode) {
        List<RowInput> inputs = new ArrayList<>();
        for (int i = 1; i < records.size(); i++) {
            ParsedRecord record = records.get(i);
            List<String> cells = record.cells();
            if (isBlank(cells)) {
                continue;
            }
            List<ApiFieldError> errors = new ArrayList<>();
            if (cells.size() > header.width() && hasContent(cells, header.width())) {
                errors.add(new ApiFieldError(null, CatalogErrorCode.CATALOG_IMPORT_ROW_INVALID, Map.of()));
            }
            if (header.typeCodeIndex() >= 0) {
                String rowTypeCode = cell(cells, header.typeCodeIndex()).trim();
                if (!rowTypeCode.isEmpty() && !rowTypeCode.equalsIgnoreCase(typeCode)) {
                    errors.add(rowInvalid("type_code"));
                }
            }
            String code = CatalogSupport.normalizeCode(cell(cells, header.codeIndex()));
            if (code == null) {
                errors.add(rowInvalid(COL_CODE));
            } else if (code.length() > CatalogSupport.MAX_CODE_LENGTH) {
                errors.add(new ApiFieldError(COL_CODE, CatalogErrorCode.CATALOG_IMPORT_ROW_INVALID,
                    Map.of(ResponseKey.FIELD.getKey(), COL_CODE, "max", CatalogSupport.MAX_CODE_LENGTH)));
            }
            String name = cell(cells, header.nameIndex()).trim();
            if (name.isEmpty()) {
                errors.add(rowInvalid(COL_NAME));
            }
            String parentCode = header.parentIndex() >= 0
                ? CatalogSupport.normalizeCode(cell(cells, header.parentIndex())) : null;
            inputs.add(new RowInput(record.number(), code, name.isEmpty() ? null : name, parentCode, errors));
        }
        return inputs;
    }

    private static String cell(List<String> cells, int index) {
        return index < cells.size() && cells.get(index) != null ? cells.get(index) : "";
    }

    private static boolean hasContent(List<String> cells, int fromIndex) {
        for (int i = fromIndex; i < cells.size(); i++) {
            String cell = cells.get(i);
            if (cell != null && !cell.isBlank()) {
                return true;
            }
        }
        return false;
    }

    private static boolean isBlank(List<String> cells) {
        for (String cell : cells) {
            if (cell != null && !cell.isBlank()) {
                return false;
            }
        }
        return true;
    }

    // ------------------------------------------------------------------
    // Errors / CSV encoding
    // ------------------------------------------------------------------

    private static ApiException validationFailed(String field) {
        return new ApiException(400, CatalogErrorCode.CATALOG_IMPORT_VALIDATION_FAILED,
            "The catalog import file is invalid", Map.of(ResponseKey.FIELD.getKey(), field));
    }

    private ApiException tooLarge() {
        return new ApiException(400, CatalogErrorCode.CATALOG_IMPORT_TOO_LARGE,
            "The catalog import file exceeds the configured row limit", Map.of());
    }

    private static ApiFieldError rowInvalid(String field) {
        return new ApiFieldError(field, CatalogErrorCode.CATALOG_IMPORT_ROW_INVALID,
            Map.of(ResponseKey.FIELD.getKey(), field));
    }

    private static ApiFieldError toFieldError(ApiException e) {
        if (!e.getErrors().isEmpty()) {
            ApiFieldError first = e.getErrors().get(0);
            return new ApiFieldError(first.getField(), first.getCode(), first.getParams());
        }
        return new ApiFieldError(null, e.getCode(), e.getParams());
    }

    private static byte[] withBom(String csv) {
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        byte[] bytes = new byte[UTF8_BOM.length + body.length];
        System.arraycopy(UTF8_BOM, 0, bytes, 0, UTF8_BOM.length);
        System.arraycopy(body, 0, bytes, UTF8_BOM.length, body.length);
        return bytes;
    }

    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        boolean quote = value.contains(",") || value.contains("\"") || value.contains("\n")
            || value.contains("\r") || !value.equals(value.trim());
        if (!quote) {
            return value;
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    // ------------------------------------------------------------------
    // Internal model
    // ------------------------------------------------------------------

    private record ParsedRecord(int number, List<String> cells) {
    }

    private record Header(int width, int codeIndex, int nameIndex, int parentIndex, int typeCodeIndex) {
    }

    private record RowInput(int row, String code, String name, String parentCode, List<ApiFieldError> errors) {
    }

    private static final class RowOutcome {
        final RowInput input;
        final List<ApiFieldError> errors = new ArrayList<>();
        ImportAction action = ImportAction.ERROR;
        UUID itemId;

        RowOutcome(RowInput input) {
            this.input = input;
        }
    }
}
