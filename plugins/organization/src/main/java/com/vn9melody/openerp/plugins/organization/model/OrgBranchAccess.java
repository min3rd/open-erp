package com.vn9melody.openerp.plugins.organization.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Branch-level access (manage/see branch) independent from department membership. */
public class OrgBranchAccess {

    public UUID id;
    public UUID userId;
    public UUID branchId;
    public Boolean isPrimary;
    public Boolean canManage;
    public Instant assignedAt;
    public LocalDate validFrom;
    public LocalDate validTo;
    public String status;

    public static OrgBranchAccess from(Map<String, Object> row) {
        OrgBranchAccess item = new OrgBranchAccess();
        item.id = OrgBranch.uuid(row.get("id"));
        item.userId = OrgBranch.uuid(row.get("user_id"));
        item.branchId = OrgBranch.uuid(row.get("branch_id"));
        item.isPrimary = OrgBranch.bool(row.get("is_primary"));
        item.canManage = OrgBranch.bool(row.get("can_manage"));
        item.assignedAt = OrgBranch.instant(row.get("assigned_at"));
        item.validFrom = date(row.get("valid_from"));
        item.validTo = date(row.get("valid_to"));
        item.status = OrgBranch.text(row.get("status"));
        return item;
    }

    private static LocalDate date(Object value) {
        return value == null ? null : LocalDate.parse(String.valueOf(value));
    }
}
