package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Per-employee consent state; no legal text is stored. */
public class EmployeeConsent {

    public UUID id;
    public UUID employeeId;
    public String purpose;
    public String status;
    public Instant grantedAt;
    public Instant revokedAt;
    public String source;
    public Instant createdAt;

    public static EmployeeConsent from(Map<String, Object> row) {
        EmployeeConsent item = new EmployeeConsent();
        item.id = Rows.uuid(row.get("id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.purpose = Rows.text(row.get("purpose"));
        item.status = Rows.text(row.get("status"));
        item.grantedAt = Rows.instant(row.get("granted_at"));
        item.revokedAt = Rows.instant(row.get("revoked_at"));
        item.source = Rows.text(row.get("source"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
