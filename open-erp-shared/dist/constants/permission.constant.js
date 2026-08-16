export var PermissionCode;
(function (PermissionCode) {
    PermissionCode["ORDER_VIEW"] = "ORDER_VIEW";
    PermissionCode["ORDER_CREATE"] = "ORDER_CREATE";
    PermissionCode["ORDER_EDIT"] = "ORDER_EDIT";
    PermissionCode["ORDER_DELETE"] = "ORDER_DELETE";
    PermissionCode["USER_VIEW"] = "USER_VIEW";
    PermissionCode["USER_MANAGE"] = "USER_MANAGE";
    PermissionCode["ROLE_VIEW"] = "ROLE_VIEW";
    PermissionCode["ROLE_MANAGE"] = "ROLE_MANAGE";
    PermissionCode["REPORT_VIEW"] = "REPORT_VIEW";
})(PermissionCode || (PermissionCode = {}));
export var RoleCode;
(function (RoleCode) {
    RoleCode["SUPER_ADMIN"] = "SUPER_ADMIN";
    RoleCode["TENANT_ADMIN"] = "TENANT_ADMIN";
    RoleCode["MANAGER"] = "MANAGER";
    RoleCode["STAFF"] = "STAFF";
    RoleCode["USER"] = "USER";
})(RoleCode || (RoleCode = {}));
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'erp_access_token',
    REFRESH_TOKEN: 'erp_refresh_token',
    USER_PROFILE: 'erp_user_profile',
    THEME: 'erp_theme',
    LANG: 'erp_lang'
};
//# sourceMappingURL=permission.constant.js.map