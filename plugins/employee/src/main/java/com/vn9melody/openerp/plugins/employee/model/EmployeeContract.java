package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public class EmployeeContract {
    public UUID id;
    public UUID employeeId;
    public String contractType;
    public String contractNo;
    public LocalDate startDate;
    public LocalDate endDate;
    public String status;
    public UUID documentId;
    public Instant createdAt;

    public static EmployeeContract from(Map<String, Object> row) {
        EmployeeContract item = new EmployeeContract();
        item.id = Rows.uuid(row.get("id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.contractType = Rows.text(row.get("contract_type"));
        item.contractNo = Rows.text(row.get("contract_no"));
        item.startDate = Rows.date(row.get("start_date"));
        item.endDate = Rows.date(row.get("end_date"));
        item.status = Rows.text(row.get("status"));
        item.documentId = Rows.uuid(row.get("document_id"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
