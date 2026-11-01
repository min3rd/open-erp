package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Tenant allowlist entry for employee self-service fields. */
public class FieldConfig {

    public String fieldKey;
    public Boolean editableByEmployee;
    public Boolean requiresApproval;
    public Integer sortOrder;
    public UUID updatedBy;
    public Instant updatedAt;

    public static FieldConfig from(Map<String, Object> row) {
        FieldConfig item = new FieldConfig();
        item.fieldKey = Rows.text(row.get("field_key"));
        item.editableByEmployee = Rows.bool(row.get("editable_by_employee"));
        item.requiresApproval = Rows.bool(row.get("requires_approval"));
        item.sortOrder = Rows.integer(row.get("sort_order"));
        item.updatedBy = Rows.uuid(row.get("updated_by"));
        item.updatedAt = Rows.instant(row.get("updated_at"));
        return item;
    }
}
