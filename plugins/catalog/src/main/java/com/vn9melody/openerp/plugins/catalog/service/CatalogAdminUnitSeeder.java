package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.cache.CatalogCache;
import com.vn9melody.openerp.plugins.catalog.gateway.CatalogGateway;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Seeds the real two-level administrative geography (province -> commune, no
 * district) as system catalog rows from {@code db/seed/provinces-communes.csv}
 * (TASK-393 / SOL-S05-001 D20).
 *
 * <p>The CSV is generated once at dev time ({@code scripts/gen-admin-units.mjs});
 * runtime never calls the network. Seeding is idempotent by
 * {@code (tenant_id IS NULL, type_id, code)} for items and by
 * {@code (parent_item_id, child_item_id)} for the direct HIERARCHY edges. All
 * reads/writes go through the core Plugin Data Gateway using the
 * {@code system_row} mirror descriptors, so the plugin keeps no DB access. A
 * missing CSV only logs a warning and never fails startup.</p>
 */
@ApplicationScoped
public class CatalogAdminUnitSeeder {

    static final String CSV_RESOURCE = "db/seed/provinces-communes.csv";
    static final String PROVINCE_TYPE_CODE = "PROVINCE";
    static final String COMMUNE_TYPE_CODE = "COMMUNE";

    /** Keeps each ExecuteBatch request well under the 4 MB gRPC message limit. */
    private static final int CHUNK = 500;
    /** The gateway may still be booting when containers start together. */
    private static final int GATEWAY_ATTEMPTS = 6;
    private static final long RETRY_DELAY_MS = 2_000;

    private static final Logger LOG = Logger.getLogger(CatalogAdminUnitSeeder.class);

    @Inject
    CatalogGateway gateway;

    @Inject
    CatalogCache cache;

    @ConfigProperty(name = "plugin.scope", defaultValue = "tenant")
    String scope;

    @ConfigProperty(name = "plugin.tenant-id")
    java.util.Optional<String> tenantIdConfig;

    void onStart(@Observes StartupEvent event) {
        for (int attempt = 1; attempt <= GATEWAY_ATTEMPTS; attempt++) {
            try {
                seed();
                return;
            } catch (RuntimeException e) {
                boolean retry = isGatewayUnavailable(e) && attempt < GATEWAY_ATTEMPTS;
                if (!retry) {
                    LOG.errorf("Catalog admin-unit seed failed (continuing startup): %s", e.getMessage());
                    return;
                }
                LOG.warnf("Catalog admin-unit seed waiting for the data gateway (%d/%d)",
                        attempt, GATEWAY_ATTEMPTS);
                try {
                    Thread.sleep(RETRY_DELAY_MS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    private static boolean isGatewayUnavailable(Throwable error) {
        return error instanceof ApiException api
                && ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE.equals(api.getCode());
    }

    /** Idempotent; each gateway batch commits on its own so a retry fills the gaps. */
    public void seed() {
        CsvData data = readCsv();
        if (data == null) {
            return;
        }
        List<CatalogType> systemTypes = gateway.systemTypesFresh();
        CatalogType provinceType = systemType(systemTypes, PROVINCE_TYPE_CODE);
        CatalogType communeType = systemType(systemTypes, COMMUNE_TYPE_CODE);
        if (provinceType == null || communeType == null) {
            LOG.warnf("Catalog admin-unit seed skipped: system types %s/%s are missing",
                    PROVINCE_TYPE_CODE, COMMUNE_TYPE_CODE);
            return;
        }

        Map<String, UUID> provinces = new HashMap<>();
        Map<String, UUID> communes = new HashMap<>();
        for (CatalogItem item : gateway.systemItemIndex()) {
            if (provinceType.id.equals(item.typeId)) {
                provinces.put(item.code, item.id);
            } else if (communeType.id.equals(item.typeId)) {
                communes.put(item.code, item.id);
            }
        }

        Map<String, String> missingProvinces = new LinkedHashMap<>();
        Map<String, String> missingCommunes = new LinkedHashMap<>();
        for (Row row : data.rows()) {
            if (!provinces.containsKey(row.provinceCode())) {
                missingProvinces.putIfAbsent(row.provinceCode(), row.provinceName());
            }
            if (!communes.containsKey(row.communeCode())) {
                missingCommunes.putIfAbsent(row.communeCode(), row.communeName());
            }
        }
        Instant now = Instant.now();
        insertItems(provinceType.id, missingProvinces, provinces, now);
        insertItems(communeType.id, missingCommunes, communes, now);

        Set<String> edgeKeys = new HashSet<>();
        for (CatalogItemEdge edge : gateway.systemEdgeIndex()) {
            if (edge.relationType == CatalogRelationType.HIERARCHY) {
                edgeKeys.add(edge.parentItemId + "|" + edge.childItemId);
            }
        }
        List<Map<String, Object>> missingEdges = new ArrayList<>();
        for (Row row : data.rows()) {
            UUID provinceId = provinces.get(row.provinceCode());
            UUID communeId = communes.get(row.communeCode());
            if (provinceId == null || communeId == null) {
                continue;
            }
            if (edgeKeys.add(provinceId + "|" + communeId)) {
                missingEdges.add(edgeParams(provinceId, communeId, now));
            }
        }
        insertEdges(missingEdges);

        if (data.summaryProvinces() != null && data.summaryProvinces() != provinces.size()) {
            LOG.warnf("Catalog admin-unit CSV declares %d provinces but %d are present",
                    data.summaryProvinces(), provinces.size());
        }
        if (data.summaryCommunes() != null && data.summaryCommunes() != communes.size()) {
            LOG.warnf("Catalog admin-unit CSV declares %d communes but %d are present",
                    data.summaryCommunes(), communes.size());
        }
        invalidateCache();
        LOG.infof("Catalog admin units ready: %d provinces, %d communes (new: %d provinces, %d communes, %d edges)",
                provinces.size(), communes.size(), missingProvinces.size(), missingCommunes.size(), missingEdges.size());
    }

    private void insertItems(UUID typeId, Map<String, String> missing, Map<String, UUID> into, Instant now) {
        List<Map.Entry<String, String>> entries = new ArrayList<>(missing.entrySet());
        for (int start = 0; start < entries.size(); start += CHUNK) {
            int end = Math.min(entries.size(), start + CHUNK);
            List<PluginDataClient.BatchStatement> statements = new ArrayList<>(end - start);
            for (int index = start; index < end; index++) {
                Map.Entry<String, String> entry = entries.get(index);
                statements.add(new PluginDataClient.BatchStatement("catalog.item.insert.mirror",
                        itemParams(typeId, entry.getKey(), entry.getValue(), now)));
            }
            for (PluginQueryResult result : gateway.batch(statements)) {
                Map<String, Object> row = result.first();
                UUID id = uuid(row == null ? null : row.get("id"));
                String code = row == null ? null : text(row.get("code"));
                if (id != null && code != null) {
                    into.put(code, id);
                }
            }
        }
    }

    private void insertEdges(List<Map<String, Object>> edges) {
        for (int start = 0; start < edges.size(); start += CHUNK) {
            int end = Math.min(edges.size(), start + CHUNK);
            List<PluginDataClient.BatchStatement> statements = new ArrayList<>(end - start);
            for (int index = start; index < end; index++) {
                statements.add(new PluginDataClient.BatchStatement("catalog.edge.insert.mirror",
                        edges.get(index)));
            }
            gateway.batch(statements);
        }
    }

    private static Map<String, Object> itemParams(UUID typeId, String code, String name, Instant now) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("type_id", typeId);
        params.put("version_group_id", UUID.randomUUID());
        params.put("version", 1);
        params.put("code", code);
        params.put("name", name);
        params.put("sort_order", 0);
        params.put("status", CatalogStatus.ACTIVE.name());
        params.put("valid_from", now);
        params.put("created_at", now);
        params.put("updated_at", now);
        return params;
    }

    private static Map<String, Object> edgeParams(UUID parentId, UUID childId, Instant now) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("parent_item_id", parentId);
        params.put("child_item_id", childId);
        params.put("relation_type", CatalogRelationType.HIERARCHY.name());
        params.put("sort_order", 0);
        params.put("status", CatalogStatus.ACTIVE.name());
        params.put("valid_from", now);
        params.put("created_at", now);
        return params;
    }

    private void invalidateCache() {
        UUID tenantId = tenantIdConfig.map(UUID::fromString).orElse(null);
        cache.invalidate(tenantId);
        if ("platform".equalsIgnoreCase(scope)) {
            cache.invalidate(null);
        }
    }

    private static CatalogType systemType(List<CatalogType> types, String code) {
        return types.stream().filter(type -> code.equals(type.code)).findFirst().orElse(null);
    }

    private static UUID uuid(Object value) {
        String text = text(value);
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(text);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
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
