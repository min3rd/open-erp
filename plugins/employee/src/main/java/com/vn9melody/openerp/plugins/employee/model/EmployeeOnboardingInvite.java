package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** One-time self-onboarding invite. Only the token hash is persisted. */
public class EmployeeOnboardingInvite {

    public UUID id;
    public UUID employeeId;
    public String email;
    public Instant expiresAt;
    public String status;
    public Instant submittedAt;
    public UUID createdBy;
    public Instant createdAt;

    public static EmployeeOnboardingInvite from(Map<String, Object> row) {
        EmployeeOnboardingInvite item = new EmployeeOnboardingInvite();
        item.id = Rows.uuid(row.get("id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.email = Rows.text(row.get("email"));
        item.expiresAt = Rows.instant(row.get("expires_at"));
        item.status = Rows.text(row.get("status"));
        item.submittedAt = Rows.instant(row.get("submitted_at"));
        item.createdBy = Rows.uuid(row.get("created_by"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
