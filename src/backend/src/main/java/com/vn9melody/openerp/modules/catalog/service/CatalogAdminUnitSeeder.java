package com.vn9melody.openerp.modules.catalog.service;

import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import com.vn9melody.openerp.modules.catalog.repository.CatalogTypeRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Seeds the real two-level administrative geography (province -> commune, no
 * district) as system catalog rows from {@code db/seed/provinces-communes.csv}
 * (TASK-393 / SOL-S05-001 D20).
 *
 * <p>The CSV is generated once at dev time ({@code scripts/gen-admin-units.mjs});
 * runtime never calls the network. Seeding is idempotent by
 * {@code (tenant_id IS NULL, type_id, code)} for items and by
 * {@code (parent_item_id, child_item_id)} for the direct HIERARCHY edges. A
 * missing CSV only logs a warning and never fails startup.</p>
 */
@ApplicationScoped
public class CatalogAdminUnitSeeder {

    static final String CSV_RESOURCE = "db/seed/provinces-communes.csv";
    static final String PROVINCE_TYPE_CODE = "PROVINCE";
    static final String COMMUNE_TYPE_CODE = "COMMUNE";

    private static final Logger LOG = Logger.getLogger(CatalogAdminUnitSeeder.class);

    @Inject
    EntityManager entityManager;

    @Inject
    CatalogTypeRepository typeRepository;

    void onStart(@Observes StartupEvent event) {
        try {
            QuarkusTransaction.requiringNew().run(this::seed);
        } catch (Exception e) {
            LOG.errorf("Catalog admin-unit seed failed (continuing startup): %s", e.getMessage());
        }
    }

    /** Requires an active transaction; safe to run repeatedly. */
    public void seed() {
        CsvData data = readCsv();
        if (data == null) {
            return;
        }
        CatalogType provinceType = typeRepository.findSystemByCode(PROVINCE_TYPE_CODE);
        CatalogType communeType = typeRepository.findSystemByCode(COMMUNE_TYPE_CODE);
        if (provinceType == null || communeType == null) {
            LOG.warnf("Catalog admin-unit seed skipped: system types %s/%s are missing",
                    PROVINCE_TYPE_CODE, COMMUNE_TYPE_CODE);
            return;
        }

        Map<String, UUID> provinces = loadSystemItems(provinceType.id);
        Map<String, UUID> communes = loadSystemItems(communeType.id);
        Set<String> edges = loadSystemHierarchyEdgeKeys();

        int newProvinces = 0;
        int newCommunes = 0;
        int newEdges = 0;
        for (Row row : data.rows()) {
            UUID provinceId = provinces.get(row.provinceCode());
            if (provinceId == null) {
                provinceId = insertItem(provinceType.id, row.provinceCode(), row.provinceName());
                provinces.put(row.provinceCode(), provinceId);
                newProvinces++;
            }
            UUID communeId = communes.get(row.communeCode());
            if (communeId == null) {
                communeId = insertItem(communeType.id, row.communeCode(), row.communeName());
                communes.put(row.communeCode(), communeId);
                newCommunes++;
            }
            if (edges.add(provinceId + "|" + communeId)) {
                insertEdge(provinceId, communeId);
                newEdges++;
            }
        }

        if (data.summaryProvinces() != null && data.summaryProvinces() != provinces.size()) {
            LOG.warnf("Catalog admin-unit CSV declares %d provinces but %d are present",
                    data.summaryProvinces(), provinces.size());
        }
        if (data.summaryCommunes() != null && data.summaryCommunes() != communes.size()) {
            LOG.warnf("Catalog admin-unit CSV declares %d communes but %d are present",
                    data.summaryCommunes(), communes.size());
        }
        LOG.infof("Catalog admin units ready: %d provinces, %d communes (new: %d provinces, %d communes, %d edges)",
                provinces.size(), communes.size(), newProvinces, newCommunes, newEdges);
    }

    private Map<String, UUID> loadSystemItems(UUID typeId) {
        Map<String, UUID> byCode = new HashMap<>();
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT code, id FROM catalog_items "
                    + "WHERE tenant_id IS NULL AND type_id = ?1 AND valid_to IS NULL")
                .setParameter(1, typeId)
                .getResultList();
        for (Object[] row : rows) {
            byCode.put((String) row[0], (UUID) row[1]);
        }
        return byCode;
    }

    private Set<String> loadSystemHierarchyEdgeKeys() {
        @SuppressWarnings("unchecked")
        List<String> keys = entityManager.createNativeQuery(
                "SELECT parent_item_id::text || '|' || child_item_id::text FROM catalog_item_edges "
                    + "WHERE tenant_id IS NULL AND relation_type = 'HIERARCHY' AND valid_to IS NULL")
                .getResultList();
        return new HashSet<>(keys);
    }

    private UUID insertItem(UUID typeId, String code, String name) {
        UUID id = UUID.randomUUID();
        entityManager.createNativeQuery(
                "INSERT INTO catalog_items "
                    + "(id, tenant_id, type_id, version_group_id, version, code, name, status, valid_from) "
                    + "VALUES (?1, NULL, ?2, ?3, 1, ?4, ?5, 'ACTIVE', now())")
                .setParameter(1, id)
                .setParameter(2, typeId)
                .setParameter(3, UUID.randomUUID())
                .setParameter(4, code)
                .setParameter(5, name)
                .executeUpdate();
        return id;
    }

    private void insertEdge(UUID parentItemId, UUID childItemId) {
        entityManager.createNativeQuery(
                "INSERT INTO catalog_item_edges "
                    + "(id, tenant_id, parent_item_id, child_item_id, relation_type, status, valid_from) "
                    + "VALUES (?1, NULL, ?2, ?3, 'HIERARCHY', 'ACTIVE', now())")
                .setParameter(1, UUID.randomUUID())
                .setParameter(2, parentItemId)
                .setParameter(3, childItemId)
                .executeUpdate();
    }

    /** Returns null (with a warning) when the CSV is absent or unreadable. */
    private CsvData readCsv() {
        InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(CSV_RESOURCE);
        if (stream == null) {
            LOG.warnf("Catalog admin-unit seed skipped: %s not found on the classpath", CSV_RESOURCE);
            return null;
        }
        Integer summaryProvinces = null;
        Integer summaryCommunes = null;
        List<Row> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("\uFEFF")) {
                    line = line.substring(1);
                }
                line = line.strip();
                if (line.isEmpty()) {
                    continue;
                }
                if (line.startsWith("#")) {
                    if (line.startsWith("# provinces:")) {
                        summaryProvinces = parseCount(line);
                    } else if (line.startsWith("# communes:")) {
                        summaryCommunes = parseCount(line);
                    }
                    continue;
                }
                if (line.startsWith("province_code,")) {
                    continue;
                }
                // Names are comma-free in the generated file, but splitting on the
                // first three commas keeps a trailing comma inside the name intact.
                String[] parts = line.split(",", 4);
                if (parts.length < 4) {
                    LOG.warnf("Catalog admin-unit CSV: skipping malformed line: %s", line);
                    continue;
                }
                rows.add(new Row(field(parts[0]), field(parts[1]), field(parts[2]), field(parts[3])));
            }
        } catch (IOException e) {
            LOG.errorf("Catalog admin-unit seed skipped: cannot read %s (%s)", CSV_RESOURCE, e.getMessage());
            return null;
        }
        if (rows.isEmpty()) {
            LOG.warnf("Catalog admin-unit seed skipped: %s contains no data rows", CSV_RESOURCE);
            return null;
        }
        return new CsvData(rows, summaryProvinces, summaryCommunes);
    }

    private static Integer parseCount(String line) {
        try {
            return Integer.valueOf(line.substring(line.indexOf(':') + 1).strip());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String field(String value) {
        String trimmed = value.strip();
        if (trimmed.length() >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            return trimmed.substring(1, trimmed.length() - 1).replace("\"\"", "\"");
        }
        return trimmed;
    }

    record Row(String provinceCode, String provinceName, String communeCode, String communeName) {
    }

    record CsvData(List<Row> rows, Integer summaryProvinces, Integer summaryCommunes) {
    }
}
