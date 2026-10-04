package com.vn9melody.openerp.core.enums;

/**
 * Tenant data storage model for plugin runtime (DES-03-DB section 3).
 * Core data keeps SHARED_SCHEMA_RLS outside this enum (Sprint 03 decision).
 */
public enum PluginStorageModel {
    DEDICATED_SCHEMA,
    DEDICATED_DATABASE;

    public static PluginStorageModel fromString(String value) {
        return EnumParser.parse(PluginStorageModel.class, value, DEDICATED_SCHEMA);
    }
}
