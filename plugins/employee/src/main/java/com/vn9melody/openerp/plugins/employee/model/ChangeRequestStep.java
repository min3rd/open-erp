package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** One sequential approval step of a change request. */
public class ChangeRequestStep {

    public UUID id;
    public UUID requestId;
    public Integer stepNo;
    public String approverType;
    public UUID approverId;
    public String status;
    public UUID actedBy;
    public Instant actedAt;
    public String comment;
    public Instant createdAt;

    public static ChangeRequestStep from(Map<String, Object> row) {
        ChangeRequestStep item = new ChangeRequestStep();
        item.id = Rows.uuid(row.get("id"));
        item.requestId = Rows.uuid(row.get("request_id"));
        item.stepNo = Rows.integer(row.get("step_no"));
        item.approverType = Rows.text(row.get("approver_type"));
        item.approverId = Rows.uuid(row.get("approver_id"));
        item.status = Rows.text(row.get("status"));
        item.actedBy = Rows.uuid(row.get("acted_by"));
        item.actedAt = Rows.instant(row.get("acted_at"));
        item.comment = Rows.text(row.get("comment"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
