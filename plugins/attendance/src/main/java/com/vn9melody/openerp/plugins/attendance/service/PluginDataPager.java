package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pages through every row of a LIST query. Tenant catalogs and period data must
 * never be truncated by a fixed page size (see AGENTS guardrail #25).
 */
public final class PluginDataPager {

    private static final int MAX_PAGES = 1000;

    private PluginDataPager() {}

    public static List<Map<String, Object>> listAll(PluginDataClient client, String queryId,
                                                    Map<String, Object> base, int pageSize) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (int page = 0; page < MAX_PAGES; page++) {
            Map<String, Object> params = new LinkedHashMap<>(base == null ? Map.of() : base);
            params.put("page", page);
            params.put("size", pageSize);
            PluginQueryResult result = client.query(queryId, params);
            rows.addAll(result.rows());
            if (result.rows().size() < pageSize) {
                break;
            }
            if (result.totalRows() > 0 && rows.size() >= result.totalRows()) {
                break;
            }
        }
        return rows;
    }
}
