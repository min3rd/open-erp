package com.vn9melody.openerp.plugins.organization.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Access membership: user belongs to a branch/department for RBAC/data scope. */
public class OrgMembership {

    public UUID id;
    public UUID userId;
    public UUID branchId;
    public UUID departmentId;
    public UUID directManagerUserId;
    public Boolean isPrimary;
    public Instant joinedAt;
    public LocalDate validFrom;
    public LocalDate validTo;
    public String status;

    public static OrgMembership from(Map<String, Object> row) {
        OrgMembership item = new OrgMembership();
        item.id = OrgBranch.uuid(row.get("id"));
        item.userId = OrgBranch.uuid(row.get("user_id"));
        item.branchId = OrgBranch.uuid(row.get("branch_id"));
        item.departmentId = OrgBranch.uuid(row.get("department_id"));
        item.directManagerUserId = OrgBranch.uuid(row.get("direct_manager_user_id"));
        item.isPrimary = OrgBranch.bool(row.get("is_primary"));
        item.joinedAt = OrgBranch.instant(row.get("joined_at"));
        item.validFrom = date(row.get("valid_from"));
        item.validTo = date(row.get("valid_to"));
        item.status = OrgBranch.text(row.get("status"));
        return item;
    }

    private static LocalDate date(Object value) {
        return value == null ? null : LocalDate.parse(String.valueOf(value));
    }
}
