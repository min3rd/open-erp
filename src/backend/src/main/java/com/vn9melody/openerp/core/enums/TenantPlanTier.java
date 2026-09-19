package com.vn9melody.openerp.core.enums;

public enum TenantPlanTier {
    COMMUNITY,
    STANDARD,
    ENTERPRISE;

    public static TenantPlanTier fromString(String value) {
        if (value == null) {
            return STANDARD;
        }
        for (TenantPlanTier tier : values()) {
            if (tier.name().equalsIgnoreCase(value.trim())) {
                return tier;
            }
        }
        return STANDARD;
    }
}
