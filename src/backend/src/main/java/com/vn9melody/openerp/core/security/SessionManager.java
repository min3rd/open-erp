package com.vn9melody.openerp.core.security;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class SessionManager {

    public static class SessionInfo {
        private String sessionId;
        private UUID userId;
        private String device;
        private String ipAddress;
        private Instant lastActiveAt;
        private Instant createdAt;

        public SessionInfo() {}

        public SessionInfo(String sessionId, UUID userId, String device, String ipAddress) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.device = device;
            this.ipAddress = ipAddress;
            this.lastActiveAt = Instant.now();
            this.createdAt = Instant.now();
        }

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        public String getDevice() { return device; }
        public void setDevice(String device) { this.device = device; }
        public String getIpAddress() { return ipAddress; }
        public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
        public Instant getLastActiveAt() { return lastActiveAt; }
        public void setLastActiveAt(Instant lastActiveAt) { this.lastActiveAt = lastActiveAt; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }

    private final Map<UUID, Map<String, SessionInfo>> userSessions = new ConcurrentHashMap<>();

    public String createSession(UUID userId, String device, String ipAddress) {
        String sessionId = UUID.randomUUID().toString();
        SessionInfo session = new SessionInfo(sessionId, userId, device, ipAddress);
        userSessions.computeIfAbsent(userId, k -> new ConcurrentHashMap<>()).put(sessionId, session);
        return sessionId;
    }

    public List<SessionInfo> getUserSessions(UUID userId) {
        Map<String, SessionInfo> sessions = userSessions.get(userId);
        if (sessions == null) {
            return Collections.emptyList();
        }
        return new ArrayList<>(sessions.values());
    }

    public boolean revokeSession(UUID userId, String sessionId) {
        Map<String, SessionInfo> sessions = userSessions.get(userId);
        if (sessions != null) {
            return sessions.remove(sessionId) != null;
        }
        return false;
    }

    public void revokeOtherSessions(UUID userId, String currentSessionId) {
        Map<String, SessionInfo> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.keySet().removeIf(id -> !id.equals(currentSessionId));
        }
    }

    public void revokeAllSessions(UUID userId) {
        userSessions.remove(userId);
    }
}
