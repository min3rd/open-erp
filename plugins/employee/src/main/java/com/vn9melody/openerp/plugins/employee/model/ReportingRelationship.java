package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public class ReportingRelationship {
    public UUID id;
    public UUID employeeId;
    public UUID managerEmployeeId;
    public String relationshipType;
    public LocalDate validFrom;
    public LocalDate validTo;
    public Instant createdAt;

    public static ReportingRelationship from(Map<String, Object> row) {
        ReportingRelationship item = new ReportingRelationship();
        item.id = Rows.uuid(row.get("id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.managerEmployeeId = Rows.uuid(row.get("manager_employee_id"));
        item.relationshipType = Rows.text(row.get("relationship_type"));
        item.validFrom = Rows.date(row.get("valid_from"));
        item.validTo = Rows.date(row.get("valid_to"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
