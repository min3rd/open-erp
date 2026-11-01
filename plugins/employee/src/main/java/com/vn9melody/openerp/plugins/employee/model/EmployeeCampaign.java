package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Bulk profile-update campaign; {@code filterJson} is the raw jsonb gateway value. */
public class EmployeeCampaign {

    public UUID id;
    public String name;
    public String filterJson;
    public LocalDate deadline;
    public String status;
    public UUID createdBy;
    public Instant createdAt;

    public static EmployeeCampaign from(Map<String, Object> row) {
        EmployeeCampaign item = new EmployeeCampaign();
        item.id = Rows.uuid(row.get("id"));
        item.name = Rows.text(row.get("name"));
        item.filterJson = Rows.text(row.get("filter"));
        item.deadline = Rows.date(row.get("deadline"));
        item.status = Rows.text(row.get("status"));
        item.createdBy = Rows.uuid(row.get("created_by"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
