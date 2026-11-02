package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Change request header; {@code changesJson} is the raw jsonb gateway value. */
public class EmployeeChangeRequest {

    public UUID id;
    public UUID employeeId;
    public UUID workflowInstanceId;
    public UUID requestedByUserId;
    public String status;
    public Integer currentStep;
    public String changesJson;
    public Instant submittedAt;
    public Instant reviewedAt;
    public String rejectionReason;
    public Long version;
    public Instant createdAt;

    public static EmployeeChangeRequest from(Map<String, Object> row) {
        EmployeeChangeRequest item = new EmployeeChangeRequest();
        item.id = Rows.uuid(row.get("id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.workflowInstanceId = Rows.uuid(row.get("workflow_instance_id"));
        item.requestedByUserId = Rows.uuid(row.get("requested_by_user_id"));
        item.status = Rows.text(row.get("status"));
        item.currentStep = Rows.integer(row.get("current_step"));
        item.changesJson = Rows.text(row.get("changes"));
        item.submittedAt = Rows.instant(row.get("submitted_at"));
        item.reviewedAt = Rows.instant(row.get("reviewed_at"));
        item.rejectionReason = Rows.text(row.get("rejection_reason"));
        item.version = Rows.longValue(row.get("version"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
