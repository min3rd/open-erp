package com.vn9melody.openerp.core.enums;

/**
 * Data scopes ordered from narrowest to broadest, matching the union rule
 * "Most Permissive" of ANL-02 section 5.
 */
public enum DataScope {
    NONE(0),
    OWN_ONLY(1),
    OWN_AND_SUBORDINATES(2),
    DEPARTMENT(3),
    DEPARTMENT_AND_CHILDREN(4),
    BRANCH(5),
    ALL(6);

    private final int rank;

    DataScope(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }

    public boolean isBroaderThan(DataScope other) {
        return other != null && this.rank > other.rank;
    }

    public DataScope mostPermissive(DataScope other) {
        if (other == null) {
            return this;
        }
        return this.rank >= other.rank ? this : other;
    }

    public static DataScope fromString(String value) {
        if (value == null) {
            return NONE;
        }
        for (DataScope scope : values()) {
            if (scope.name().equalsIgnoreCase(value.trim())) {
                return scope;
            }
        }
        return NONE;
    }
}
