package com.vn9melody.openerp.modules.platform.api;

import com.vn9melody.openerp.core.api.ApiErrorResponse;
import jakarta.ws.rs.core.Response;
import java.util.LinkedHashMap;
import java.util.Map;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Small helpers shared by the Platform resources: envelope payload maps,
 * caller identity extraction and deny responses for filters.
 */
public final class PlatformSupport {

    public static final String JWT_CONTEXT_PROPERTY = "openerp.platform.jwt";

    private PlatformSupport() {}

    public static Map<String, Object> payload() {
        return new LinkedHashMap<>();
    }

    public static Map<String, Object> payload(PlatformResponseKey key, Object value) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put(key.getKey(), value);
        return map;
    }

    public static Map<String, Object> payload(PlatformResponseKey k1, Object v1, PlatformResponseKey k2, Object v2) {
        Map<String, Object> map = payload(k1, v1);
        map.put(k2.getKey(), v2);
        return map;
    }

    public static Map<String, Object> payload(PlatformResponseKey k1, Object v1, PlatformResponseKey k2, Object v2,
                                              PlatformResponseKey k3, Object v3) {
        Map<String, Object> map = payload(k1, v1, k2, v2);
        map.put(k3.getKey(), v3);
        return map;
    }

    public static Map<String, Object> payload(PlatformResponseKey k1, Object v1, PlatformResponseKey k2, Object v2,
                                              PlatformResponseKey k3, Object v3, PlatformResponseKey k4, Object v4) {
        Map<String, Object> map = payload(k1, v1, k2, v2, k3, v3);
        map.put(k4.getKey(), v4);
        return map;
    }

    public static Response deny(int status, String code, String message) {
        return Response.status(status).entity(new ApiErrorResponse(code, message)).build();
    }

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
