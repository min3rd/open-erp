package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** One row of the tenant approval configuration. */
public class EmployeeApprovalConfig {

    public UUID id;
    public String scopeType;
    public UUID scopeId;
    public String fieldGroup;
    public Integer stepNo;
    public String approverType;
    public UUID approverId;
    public Instant createdAt;

    public static EmployeeApprovalConfig from(Map<String, Object> row) {
        EmployeeApprovalConfig item = new EmployeeApprovalConfig();
        item.id = Rows.uuid(row.get("id"));
        item.scopeType = Rows.text(row.get("scope_type"));
        item.scopeId = Rows.uuid(row.get("scope_id"));
        item.fieldGroup = Rows.text(row.get("field_group"));
        item.stepNo = Rows.integer(row.get("step_no"));
        item.approverType = Rows.text(row.get("approver_type"));
        item.approverId = Rows.uuid(row.get("approver_id"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
