package com.vn9melody.openerp.core.enums;

/**
 * Audit/platform action catalog union of DES-02-API section 2.3 and the coverage
 * matrix in SOL-01 section 3.6. Every value maps to its default audit scope.
 */
public enum PlatformAction {
    TENANT_LOCK(AuditScope.PLATFORM),
    TENANT_UNLOCK(AuditScope.PLATFORM),
    TENANT_QUOTA_UPDATE(AuditScope.PLATFORM),
    USER_GLOBAL_LOCK(AuditScope.PLATFORM),
    USER_GLOBAL_UNLOCK(AuditScope.PLATFORM),
    USER_FORCE_PASSWORD_RESET(AuditScope.PLATFORM),
    USER_BREAK_GLASS_DISABLE_2FA(AuditScope.PLATFORM),
    IMPERSONATION_START(AuditScope.PLATFORM),
    IMPERSONATION_END(AuditScope.PLATFORM),
    IMPERSONATION_TIMEOUT(AuditScope.PLATFORM),
    IAM_ROLE_CREATE(AuditScope.TENANT),
    IAM_ROLE_UPDATE(AuditScope.TENANT),
    IAM_ROLE_DELETE(AuditScope.TENANT),
    IAM_ROLE_PERMISSION_UPDATE(AuditScope.TENANT),
    IAM_ROLE_DATA_POLICY_UPDATE(AuditScope.TENANT),
    IAM_USER_ROLE_ASSIGN(AuditScope.TENANT),
    IAM_USER_ROLE_REMOVE(AuditScope.TENANT),
    ORG_BRANCH_CREATE(AuditScope.TENANT),
    ORG_BRANCH_UPDATE(AuditScope.TENANT),
    ORG_BRANCH_DELETE(AuditScope.TENANT),
    ORG_DEPARTMENT_CREATE(AuditScope.TENANT),
    ORG_DEPARTMENT_MOVE(AuditScope.TENANT),
    ORG_DEPARTMENT_DELETE(AuditScope.TENANT),
    ORG_MEMBERSHIP_ASSIGN(AuditScope.TENANT),
    ORG_MEMBERSHIP_UPDATE(AuditScope.TENANT),
    ORG_MEMBERSHIP_REMOVE(AuditScope.TENANT),
    ORG_BRANCH_ASSIGNMENT_CREATE(AuditScope.TENANT),
    ORG_BRANCH_ASSIGNMENT_UPDATE(AuditScope.TENANT),
    ORG_BRANCH_ASSIGNMENT_DELETE(AuditScope.TENANT),
    PLATFORM_ADMIN_BOOTSTRAPPED(AuditScope.PLATFORM),
    PLATFORM_ADMIN_GRANTED(AuditScope.PLATFORM),
    PLATFORM_ADMIN_DISABLED(AuditScope.PLATFORM),
    PLATFORM_ADMIN_ENABLED(AuditScope.PLATFORM),
    PLATFORM_ADMIN_REVOKED(AuditScope.PLATFORM),
    PLATFORM_ADMIN_PASSWORD_RESET_SENT(AuditScope.PLATFORM),
    PLATFORM_ADMIN_2FA_DISABLED(AuditScope.PLATFORM);

    private final AuditScope defaultScope;

    PlatformAction(AuditScope defaultScope) {
        this.defaultScope = defaultScope;
    }

    public AuditScope getDefaultScope() {
        return defaultScope;
    }

    public static PlatformAction fromString(String value) {
        if (value == null) {
            return null;
        }
        for (PlatformAction action : values()) {
            if (action.name().equalsIgnoreCase(value.trim())) {
                return action;
            }
        }
        return null;
    }
}
