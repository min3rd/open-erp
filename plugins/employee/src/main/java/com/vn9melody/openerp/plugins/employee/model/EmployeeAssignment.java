package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Effective-dated HR assignment; access membership remains owned by organization. */
public class EmployeeAssignment {

    public UUID id;
    public UUID employeeId;
    public UUID branchId;
    public UUID departmentId;
    public String jobTitle;
    public UUID jobTitleCatalogId;
    public UUID managerEmployeeId;
    public Boolean isPrimary;
    public LocalDate validFrom;
    public LocalDate validTo;
    public String status;
    public Instant createdAt;

    public static EmployeeAssignment from(Map<String, Object> row) {
        EmployeeAssignment item = new EmployeeAssignment();
        item.id = Rows.uuid(row.get("id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.branchId = Rows.uuid(row.get("branch_id"));
        item.departmentId = Rows.uuid(row.get("department_id"));
        item.jobTitle = Rows.text(row.get("job_title"));
        item.jobTitleCatalogId = Rows.uuid(row.get("job_title_catalog_id"));
        item.managerEmployeeId = Rows.uuid(row.get("manager_employee_id"));
        item.isPrimary = Rows.bool(row.get("is_primary"));
        item.validFrom = Rows.date(row.get("valid_from"));
        item.validTo = Rows.date(row.get("valid_to"));
        item.status = Rows.text(row.get("status"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
