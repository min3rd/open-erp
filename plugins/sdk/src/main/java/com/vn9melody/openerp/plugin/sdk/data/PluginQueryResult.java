package com.vn9melody.openerp.plugin.sdk.data;

import java.util.List;
import java.util.Map;

/** Result of one plugin data query: rows, total (LIST) and affected rows (WRITE). */
public record PluginQueryResult(List<Map<String, Object>> rows, long totalRows, long affectedRows) {

    public PluginQueryResult {
        rows = rows == null ? List.of() : List.copyOf(rows);
    }

    public boolean isEmpty() {
        return rows.isEmpty();
    }

    public Map<String, Object> first() {
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }
}
