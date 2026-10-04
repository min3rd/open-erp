package com.vn9melody.openerp.core.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ResponseKey {
    // Identity & User
    USER_ID("user_id"),
    EMAIL("email"),
    FULL_NAME("full_name"),
    PHONE("phone"),
    STATUS("status"),

    // Tenant & Workspace
    IS_DEFAULT("is_default"),

    // Validation, Rate Limit & Availability
    FIELD("field"),
    SLUG("slug"),
    LOCKED_SECONDS("locked_seconds"),
    RETRY_AFTER("retry_after"),

    // Reference Entity & Data Permission Engine (FEAT-17, TASK-284)
    ID("id"),
    TITLE("title"),
    BRANCH_ID("branch_id"),
    BRANCH_NAME("branch_name"),
    DEPARTMENT_ID("department_id"),
    DEPARTMENT_NAME("department_name"),
    ASSIGNEE_ID("assignee_id"),

    // IAM Enforcement & Quota params
    PERMISSION("permission"),
    REQUIRED_PERMISSION("required_permission"),
    QUOTA("quota"),
    CURRENT("current"),
    RESOURCE("resource"),

    // IAM/Organization audit details (TASK-267/291)
    CODE("code"),
    NAME("name"),
    DESCRIPTION("description"),
    ROLE_ID("role_id"),
    ROLE_CODE("role_code"),
    ROLE_IDS("role_ids"),
    USER_IDS("user_ids"),
    PERMISSION_IDS("permission_ids"),
    ASSIGNED_USERS_COUNT("assigned_users_count"),
    ASSIGNED_ROLES_COUNT("assigned_roles_count"),
    UPDATED_COUNT("updated_count"),

    // Plugin allowlist (TASK-270 / BUG-53)
    PLUGIN("plugin"),
    ALLOWED_PLUGINS("allowed_plugins"),
    ACTION("action"),
    ADDRESS("address"),
    ASSIGNED_AT("assigned_at"),
    ASSIGNMENTS("assignments"),
    BRANCH_CODE("branch_code"),
    CAN_MANAGE("can_manage"),
    CHILDREN("children"),
    CREATE_SCOPE("create_scope"),
    DELETE_SCOPE("delete_scope"),
    DESCRIPTION_KEY("description_key"),
    DIRECT_MANAGER_NAME("direct_manager_name"),
    DIRECT_MANAGER_USER_ID("direct_manager_user_id"),
    DOMAIN("domain"),
    ENTITY_CLASS("entity_class"),
    EXPORT_SCOPE("export_scope"),
    IS_PRIMARY("is_primary"),
    IS_SYSTEM("is_system"),
    ITEMS("items"),
    JOINED_AT("joined_at"),
    MANAGER_NAME("manager_name"),
    MANAGER_USER_ID("manager_user_id"),
    NEW_PARENT_ID("new_parent_id"),
    OPERATION("operation"),
    PARENT_ID("parent_id"),
    POLICIES("policies"),
    READ_SCOPE("read_scope"),
    REASSIGN_MEMBERS_TO("reassign_members_to"),
    SCOPE("scope"),
    SCOPE_FIELDS("scope_fields"),
    SHARE_SCOPE("share_scope"),
    SUPPORTS_ASSIGNEE("supports_assignee"),
    TABLE_NAME("table_name"),
    TOTAL_PERMISSIONS_GRANTED("total_permissions_granted"),
    UPDATE_SCOPE("update_scope"),
    USER_EMAIL("user_email"),
    USER_FULL_NAME("user_full_name");

    /**
     * Compile-time JSON names for Jackson annotations: {@code @JsonProperty} requires
     * constant expressions, which enum constants are not. Values mirror the enum
     * constants 1:1 (guarded by a unit test).
     */
    public interface Json {
        String ACTION = "action";
        String ADDRESS = "address";
        String ASSIGNED_AT = "assigned_at";
        String ASSIGNED_ROLES_COUNT = "assigned_roles_count";
        String ASSIGNED_USERS_COUNT = "assigned_users_count";
        String ASSIGNMENTS = "assignments";
        String BRANCH_CODE = "branch_code";
        String BRANCH_ID = "branch_id";
        String BRANCH_NAME = "branch_name";
        String CAN_MANAGE = "can_manage";
        String CHILDREN = "children";
        String CODE = "code";
        String CREATE_SCOPE = "create_scope";
        String DELETE_SCOPE = "delete_scope";
        String DEPARTMENT_ID = "department_id";
        String DEPARTMENT_NAME = "department_name";
        String DESCRIPTION = "description";
        String DESCRIPTION_KEY = "description_key";
        String DIRECT_MANAGER_NAME = "direct_manager_name";
        String DIRECT_MANAGER_USER_ID = "direct_manager_user_id";
        String DOMAIN = "domain";
        String EMAIL = "email";
        String ENTITY_CLASS = "entity_class";
        String EXPORT_SCOPE = "export_scope";
        String FULL_NAME = "full_name";
        String ID = "id";
        String IS_DEFAULT = "is_default";
        String IS_PRIMARY = "is_primary";
        String IS_SYSTEM = "is_system";
        String ITEMS = "items";
        String JOINED_AT = "joined_at";
        String MANAGER_NAME = "manager_name";
        String MANAGER_USER_ID = "manager_user_id";
        String NAME = "name";
        String NEW_PARENT_ID = "new_parent_id";
        String OPERATION = "operation";
        String PARENT_ID = "parent_id";
        String PERMISSION_IDS = "permission_ids";
        String PHONE = "phone";
        String PLUGIN = "plugin";
        String POLICIES = "policies";
        String READ_SCOPE = "read_scope";
        String REASSIGN_MEMBERS_TO = "reassign_members_to";
        String RESOURCE = "resource";
        String ROLE_ID = "role_id";
        String ROLE_IDS = "role_ids";
        String SCOPE = "scope";
        String SCOPE_FIELDS = "scope_fields";
        String SHARE_SCOPE = "share_scope";
        String STATUS = "status";
        String SUPPORTS_ASSIGNEE = "supports_assignee";
        String TABLE_NAME = "table_name";
        String TITLE = "title";
        String TOTAL_PERMISSIONS_GRANTED = "total_permissions_granted";
        String UPDATED_COUNT = "updated_count";
        String UPDATE_SCOPE = "update_scope";
        String USER_EMAIL = "user_email";
        String USER_FULL_NAME = "user_full_name";
        String USER_ID = "user_id";
        String USER_IDS = "user_ids";
    }

    private final String key;

    ResponseKey(String key) {
        this.key = key;
    }

    @JsonValue
    public String getKey() {
        return key;
    }

    @Override
    public String toString() {
        return key;
    }
}
