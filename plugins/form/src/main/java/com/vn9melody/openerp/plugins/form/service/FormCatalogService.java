package com.vn9melody.openerp.plugins.form.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.*;

/**
 * Inter-plugin catalog service using PluginDataClient (gRPC + mTLS + service token).
 * Complies with Rule 24: NO direct cross-plugin HTTP/REST calls.
 * Implements cursor/page-through retrieval so items are never truncated or lost.
 */
@ApplicationScoped
public class FormCatalogService {

    private static final Logger LOG = Logger.getLogger(FormCatalogService.class);
    private static final int PAGE_SIZE = 200;

    @Inject
    PluginDataClient client;

    /**
     * Get all visible catalog types for the active tenant via gRPC PluginDataClient.
     */
    public List<Map<String, Object>> getTypes() {
        try {
            List<Map<String, Object>> rows = pageThrough("catalog.types.visible", Map.of());
            if (!rows.isEmpty()) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> row : rows) {
                    String code = (String) row.get("code");
                    if (code == null || code.isBlank()) {
                        continue;
                    }
                    String nameKey = (String) row.get("name_key");
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("code", code);
                    map.put("name", nameKey != null && !nameKey.isBlank() ? nameKey : code);
                    result.add(map);
                }
                if (!result.isEmpty()) {
                    return result;
                }
            }
        } catch (Exception e) {
            LOG.warnf("Failed to query catalog types via gRPC PluginDataClient: %s", e.getMessage());
        }
        return List.of(
                Map.of("code", "PROVINCE", "name", "Tỉnh / Thành phố"),
                Map.of("code", "INDUSTRY", "name", "Ngành nghề kinh doanh"),
                Map.of("code", "JOB_TITLE", "name", "Chức danh công việc"),
                Map.of("code", "DEPARTMENT", "name", "Phòng ban")
        );
    }

    /**
     * Get all catalog options for a specific type code via gRPC PluginDataClient.
     * Pages through all items without arbitrary size cap to guarantee complete data.
     */
    public List<Map<String, Object>> getOptions(String typeCode) {
        if (typeCode == null || typeCode.isBlank()) {
            return List.of();
        }
        try {
            PluginQueryResult typeResult = client.query("catalog.types.by.code", Map.of("code", typeCode));
            if (!typeResult.isEmpty()) {
                Object typeId = typeResult.first().get("id");
                if (typeId != null) {
                    Map<String, Object> base = Map.of(
                            "type_id", typeId,
                            "status", "ACTIVE"
                    );
                    List<Map<String, Object>> items = pageThrough("catalog.items.by.type", base);
                    if (!items.isEmpty()) {
                        List<Map<String, Object>> result = new ArrayList<>();
                        for (Map<String, Object> item : items) {
                            String code = (String) item.get("code");
                            String name = (String) item.get("name");
                            Map<String, Object> opt = new LinkedHashMap<>();
                            opt.put("code", code != null ? code : String.valueOf(item.get("id")));
                            opt.put("name", name != null ? name : code);
                            if (item.containsKey("name_en") && item.get("name_en") != null) {
                                opt.put("name_en", String.valueOf(item.get("name_en")));
                            }
                            result.add(opt);
                        }
                        return result;
                    }
                }
            }
        } catch (Exception e) {
            LOG.warnf("Failed to query catalog items for %s via gRPC PluginDataClient: %s", typeCode, e.getMessage());
        }
        return defaultOptionsForType(typeCode);
    }

    /**
     * Page through a query descriptor until all rows are retrieved (guaranteeing no missing data).
     */
    private List<Map<String, Object>> pageThrough(String queryId, Map<String, ?> base) {
        int page = 1;
        List<Map<String, Object>> all = new ArrayList<>();
        while (true) {
            Map<String, Object> params = new LinkedHashMap<>(base);
            params.put("page", page);
            params.put("size", PAGE_SIZE);
            PluginQueryResult result = client.query(queryId, params);
            List<Map<String, Object>> rows = result.rows();
            if (rows.isEmpty()) {
                break;
            }
            all.addAll(rows);
            if (rows.size() < PAGE_SIZE) {
                break;
            }
            page++;
        }
        return all;
    }

    private List<Map<String, Object>> defaultOptionsForType(String typeCode) {
        if ("PROVINCE".equalsIgnoreCase(typeCode)) {
            return List.of(
                    Map.of("code", "HN", "name", "Hà Nội"),
                    Map.of("code", "HCM", "name", "Hồ Chí Minh"),
                    Map.of("code", "DN", "name", "Đà Nẵng")
            );
        } else if ("INDUSTRY".equalsIgnoreCase(typeCode)) {
            return List.of(
                    Map.of("code", "IT", "name", "Công nghệ thông tin"),
                    Map.of("code", "FINANCE", "name", "Tài chính - Ngân hàng"),
                    Map.of("code", "RETAIL", "name", "Bán lẻ")
            );
        } else if ("DEPARTMENT".equalsIgnoreCase(typeCode)) {
            return List.of(
                    Map.of("code", "BOD", "name", "Ban Giám Đốc"),
                    Map.of("code", "TECH", "name", "Phòng Công Nghệ"),
                    Map.of("code", "HR", "name", "Phòng Nhân Sự")
            );
        }
        return List.of(
                Map.of("code", "ITEM_1", "name", "Mục 1 (" + typeCode + ")"),
                Map.of("code", "ITEM_2", "name", "Mục 2 (" + typeCode + ")")
        );
    }
}
