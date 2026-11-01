package com.vn9melody.openerp.plugins.organization.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Department row; parent is a local department. */
public class OrgDepartment {

    public UUID id;
    public UUID branchId;
    public UUID parentId;
    public String code;
    public String name;
    public UUID managerUserId;
    public String status;
    public Instant createdAt;

    public static OrgDepartment from(Map<String, Object> row) {
        OrgDepartment item = new OrgDepartment();
        item.id = OrgBranch.uuid(row.get("id"));
        item.branchId = OrgBranch.uuid(row.get("branch_id"));
        item.parentId = OrgBranch.uuid(row.get("parent_id"));
        item.code = OrgBranch.text(row.get("code"));
        item.name = OrgBranch.text(row.get("name"));
        item.managerUserId = OrgBranch.uuid(row.get("manager_user_id"));
        item.status = OrgBranch.text(row.get("status"));
        item.createdAt = OrgBranch.instant(row.get("created_at"));
        return item;
    }
}
