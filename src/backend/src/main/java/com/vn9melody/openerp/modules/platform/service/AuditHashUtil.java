package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Deterministic hash-chain helpers for the immutable audit trail (SOL-01 section 3.3).
 * The canonical form recursively sorts JSON object keys so the hash stays stable
 * across PostgreSQL JSONB key reordering.
 */
public final class AuditHashUtil {

    private AuditHashUtil() {}

    public static JsonNode canonicalize(JsonNode node, ObjectMapper mapper) {
        if (node == null || node.isNull()) {
            return mapper.nullNode();
        }
        if (node.isObject()) {
            ObjectNode out = mapper.createObjectNode();
            List<String> names = new ArrayList<>();
            node.fieldNames().forEachRemaining(names::add);
            names.sort(String::compareTo);
            for (String name : names) {
                out.set(name, canonicalize(node.get(name), mapper));
            }
            return out;
        }
        if (node.isArray()) {
            ArrayNode out = mapper.createArrayNode();
            for (JsonNode child : node) {
                out.add(canonicalize(child, mapper));
            }
            return out;
        }
        return node;
    }

    public static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hashed.length * 2);
            for (byte b : hashed) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    public static String computeEntryHash(ObjectMapper mapper, AuditLogEntry entry, UUID eventId,
                                          Instant createdAt, String prevHash) {
        ObjectNode payload = mapper.createObjectNode();
        payload.put("event_id", eventId != null ? eventId.toString() : null);
        payload.put("actor_user_id", entry.actorUserId != null ? entry.actorUserId.toString() : null);
        payload.put("action", entry.action);
        payload.put("resource_type", entry.resourceType);
        payload.put("resource_id", entry.resourceId != null ? entry.resourceId.toString() : null);
        payload.put("target_tenant_id", entry.targetTenantId != null ? entry.targetTenantId.toString() : null);
        payload.put("target_user_id", entry.targetUserId != null ? entry.targetUserId.toString() : null);
        payload.put("result", entry.result != null ? entry.result.name() : null);
        payload.set("details", canonicalize(entry.details, mapper));
        payload.put("created_at", createdAt.toString());
        if (prevHash == null) {
            payload.putNull("prev_hash");
        } else {
            payload.put("prev_hash", prevHash);
        }

        try {
            String canonicalJson = mapper.writeValueAsString(canonicalize(payload, mapper));
            return sha256Hex((prevHash == null ? "" : prevHash) + canonicalJson);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to canonicalize audit payload", e);
        }
    }
}
