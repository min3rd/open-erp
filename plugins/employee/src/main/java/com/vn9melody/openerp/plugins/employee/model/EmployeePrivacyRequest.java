package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Privacy (DSAR) request header; {@code payloadJson} is the raw jsonb value. */
public class EmployeePrivacyRequest {

    public UUID id;
    public UUID subjectUserId;
    public UUID employeeId;
    public String requestType;
    public String status;
    public String payloadJson;
    public Instant dueAt;
    public Instant completedAt;
    public Instant createdAt;

    public static EmployeePrivacyRequest from(Map<String, Object> row) {
        EmployeePrivacyRequest item = new EmployeePrivacyRequest();
        item.id = Rows.uuid(row.get("id"));
        item.subjectUserId = Rows.uuid(row.get("subject_user_id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.requestType = Rows.text(row.get("request_type"));
        item.status = Rows.text(row.get("status"));
        item.payloadJson = Rows.text(row.get("payload"));
        item.dueAt = Rows.instant(row.get("due_at"));
        item.completedAt = Rows.instant(row.get("completed_at"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
