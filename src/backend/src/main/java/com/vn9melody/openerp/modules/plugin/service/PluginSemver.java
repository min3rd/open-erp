package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.modules.plugin.api.PluginSupport;
import java.util.ArrayList;
import java.util.List;

/**
 * Minimal SemVer comparator and range matcher (SOL-01 section 5, decision 2).
 * Supported ranges: exact, ">=x.y.z", "<x.y.z", "^x.y.z", "~x.y.z",
 * multiple conditions separated by spaces or commas.
 */
public final class PluginSemver {

    private PluginSemver() {}

    public record Version(int major, int minor, int patch) implements Comparable<Version> {

        public static Version parse(String value) {
            if (!PluginSupport.isValidSemver(value)) {
                throw new IllegalArgumentException("Invalid SemVer: " + value);
            }
            String[] parts = value.trim().split("\\.");
            return new Version(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), Integer.parseInt(parts[2]));
        }

        @Override
        public int compareTo(Version other) {
            int result = Integer.compare(major, other.major);
            if (result != 0) {
                return result;
            }
            result = Integer.compare(minor, other.minor);
            if (result != 0) {
                return result;
            }
            return Integer.compare(patch, other.patch);
        }
    }

    public static boolean satisfies(String version, String range) {
        if (range == null || range.isBlank() || "*".equals(range.trim())) {
            return true;
        }
        Version target = Version.parse(version);
        String normalized = range.replace(",", " ").trim();
        for (String condition : normalized.split("\\s+")) {
            if (condition.isBlank()) {
                continue;
            }
            if (!matchesCondition(target, condition)) {
                return false;
            }
        }
        return true;
    }

    private static boolean matchesCondition(Version target, String condition) {
        if (condition.startsWith(">=")) {
            return target.compareTo(Version.parse(condition.substring(2).trim())) >= 0;
        }
        if (condition.startsWith("<=")) {
            return target.compareTo(Version.parse(condition.substring(2).trim())) <= 0;
        }
        if (condition.startsWith(">")) {
            return target.compareTo(Version.parse(condition.substring(1).trim())) > 0;
        }
        if (condition.startsWith("<")) {
            return target.compareTo(Version.parse(condition.substring(1).trim())) < 0;
        }
        if (condition.startsWith("^")) {
            Version base = Version.parse(condition.substring(1).trim());
            return target.compareTo(base) >= 0 && target.major() == base.major();
        }
        if (condition.startsWith("~")) {
            Version base = Version.parse(condition.substring(1).trim());
            return target.compareTo(base) >= 0 && target.major() == base.major() && target.minor() == base.minor();
        }
        return target.compareTo(Version.parse(condition)) == 0;
    }

    public static String highest(List<String> versions) {
        List<Version> parsed = new ArrayList<>();
        for (String version : versions) {
            if (PluginSupport.isValidSemver(version)) {
                parsed.add(Version.parse(version));
            }
        }
        return parsed.stream().max(Version::compareTo).map(PluginSemver::format).orElse(null);
    }

    public static String format(Version version) {
        return version.major() + "." + version.minor() + "." + version.patch();
    }
}
