package com.vn9melody.openerp.core.enums;

public enum TenantPlanTier {
    COMMUNITY,
    STANDARD,
    ENTERPRISE;

    public static TenantPlanTier fromString(String value) {
        return EnumParser.parse(TenantPlanTier.class, value, STANDARD);
    }
}
