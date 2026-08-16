package com.vn9melody.security.jwt;

public final class JwtClaimsConstant {
    public static final String ISSUER = "open-erp-auth";
    public static final String USER_ID = "userId";
    public static final String TENANT_ID = "tenantId";
    public static final String DEPARTMENT_ID = "departmentId";
    public static final String DATA_SCOPE = "dataScope";
    public static final String PERMISSIONS = "permissions";
    public static final String ROLES = "groups";

    // Header Keys for REST and Kafka record headers
    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String HEADER_X_TENANT_ID = "X-Tenant-Id";
    public static final String HEADER_X_USER_ID = "X-User-Id";
    public static final String HEADER_X_USERNAME = "X-Username";
    public static final String HEADER_X_DEPARTMENT_ID = "X-Department-Id";
    public static final String HEADER_X_DATA_SCOPE = "X-Data-Scope";
    public static final String HEADER_X_USER_CONTEXT = "X-User-Context";

    private JwtClaimsConstant() {
    }
}
