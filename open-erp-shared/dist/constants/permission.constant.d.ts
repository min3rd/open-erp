export declare enum PermissionCode {
    ORDER_VIEW = "ORDER_VIEW",
    ORDER_CREATE = "ORDER_CREATE",
    ORDER_EDIT = "ORDER_EDIT",
    ORDER_DELETE = "ORDER_DELETE",
    USER_VIEW = "USER_VIEW",
    USER_MANAGE = "USER_MANAGE",
    ROLE_VIEW = "ROLE_VIEW",
    ROLE_MANAGE = "ROLE_MANAGE",
    REPORT_VIEW = "REPORT_VIEW"
}
export declare enum RoleCode {
    SUPER_ADMIN = "SUPER_ADMIN",
    TENANT_ADMIN = "TENANT_ADMIN",
    MANAGER = "MANAGER",
    STAFF = "STAFF",
    USER = "USER"
}
export declare const STORAGE_KEYS: {
    ACCESS_TOKEN: string;
    REFRESH_TOKEN: string;
    USER_PROFILE: string;
    THEME: string;
    LANG: string;
};
