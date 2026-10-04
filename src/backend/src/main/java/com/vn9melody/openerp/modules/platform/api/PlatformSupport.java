package com.vn9melody.openerp.modules.platform.api;

import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Small helpers shared by the Platform resources: caller identity extraction.
 */
public final class PlatformSupport {

    public static final String JWT_CONTEXT_PROPERTY = "openerp.platform.jwt";

    private PlatformSupport() {}

    public static String claim(JsonWebToken jwt, String name) {
        if (jwt == null) {
            return null;
        }
        try {
            return jwt.getClaim(name);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * SmallRye JWT may expose boolean claims as {@code jakarta.json.JsonValue}
     * depending on the parser path, so normalize before comparing.
     */
    public static boolean booleanClaim(JsonWebToken jwt, String name) {
        if (jwt == null) {
            return false;
        }
        try {
            Object value = jwt.getClaim(name);
            if (value == null) {
                return false;
            }
            if (value instanceof Boolean bool) {
                return bool;
            }
            return "true".equalsIgnoreCase(value.toString());
        } catch (Exception e) {
            return false;
        }
    }
}
