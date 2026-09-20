package com.vn9melody.openerp.modules.plugin.api;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Shared validation helpers for plugin keys, SemVer, permission codes and
 * reserved system keys (DES-03-API section 3.1 / ANL-02 BR-CLI-01).
 */
public final class PluginSupport {
    private PluginSupport() {}

    public static final Pattern PLUGIN_KEY_PATTERN = Pattern.compile("^[a-z][a-z0-9-]{2,49}$");
    public static final Pattern SEMVER_PATTERN = Pattern.compile("^\\d+\\.\\d+\\.\\d+$");
    public static final Pattern PERMISSION_PATTERN =
            Pattern.compile("^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$");
    public static final Set<String> RESERVED_KEYS = Set.of("core", "iam", "platform", "organization", "plugins");

    public static boolean isValidPluginKey(String value) {
        return value != null && PLUGIN_KEY_PATTERN.matcher(value).matches();
    }

    public static boolean isReservedKey(String value) {
        return value != null && RESERVED_KEYS.contains(value.toLowerCase());
    }

    public static boolean isValidSemver(String value) {
        return value != null && SEMVER_PATTERN.matcher(value).matches();
    }

    public static boolean isValidPermission(String value) {
        return value != null && PERMISSION_PATTERN.matcher(value).matches();
    }
}
