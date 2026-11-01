package com.vn9melody.openerp.plugins.organization.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Branch row; DB access is owned by the Core data gateway. */
public class OrgBranch {

    public UUID id;
    public String code;
    public String name;
    public String phone;
    public String address;
    public Boolean isDefault;
    public String status;
    public Instant createdAt;

    public static OrgBranch from(Map<String, Object> row) {
        OrgBranch item = new OrgBranch();
        item.id = uuid(row.get("id"));
        item.code = text(row.get("code"));
        item.name = text(row.get("name"));
        item.phone = text(row.get("phone"));
        item.address = text(row.get("address"));
        item.isDefault = bool(row.get("is_default"));
        item.status = text(row.get("status"));
        item.createdAt = instant(row.get("created_at"));
        return item;
    }

    protected static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    protected static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }

    protected static Boolean bool(Object value) {
        return value == null ? null : Boolean.valueOf(String.valueOf(value));
    }

    protected static Instant instant(Object value) {
        return value == null ? null : Instant.parse(String.valueOf(value));
    }
}
