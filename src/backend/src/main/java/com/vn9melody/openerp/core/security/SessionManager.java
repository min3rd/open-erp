package com.vn9melody.openerp.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.set.SetCommands;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.*;

@ApplicationScoped
public class SessionManager {
    private static final long SESSION_TTL_SECONDS = 7L * 24 * 60 * 60; // 7 days

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

    @Inject
    RedisDataSource redis;

    @Inject
    ObjectMapper objectMapper;

    public String createSession(UUID userId, String device, String ipAddress) {
        String sessionId = UUID.randomUUID().toString();
        SessionInfo session = new SessionInfo(sessionId, userId, device, ipAddress);
        valueCommands().setex(sessionKey(sessionId), SESSION_TTL_SECONDS, serialize(session));
        setCommands().sadd(userSessionsKey(userId), sessionId);
        keyCommands().expire(userSessionsKey(userId), SESSION_TTL_SECONDS);
        return sessionId;
    }

    public List<SessionInfo> getUserSessions(UUID userId) {
        Set<String> sessionIds = setCommands().smembers(userSessionsKey(userId));
        if (sessionIds == null || sessionIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<SessionInfo> sessions = new ArrayList<>(sessionIds.size());
        for (String sessionId : sessionIds) {
            String json = valueCommands().get(sessionKey(sessionId));
            if (json == null) {
                setCommands().srem(userSessionsKey(userId), sessionId);
                continue;
            }
            SessionInfo session = deserialize(json);
            if (session != null) {
                sessions.add(session);
            }
        }
        return sessions;
    }

    public boolean revokeSession(UUID userId, String sessionId) {
        if (userId == null || sessionId == null) {
            return false;
        }
        String json = valueCommands().get(sessionKey(sessionId));
        if (json == null) {
            setCommands().srem(userSessionsKey(userId), sessionId);
            return false;
        }
        SessionInfo session = deserialize(json);
        if (session == null || !userId.equals(session.getUserId())) {
            return false;
        }
        keyCommands().del(sessionKey(sessionId));
        setCommands().srem(userSessionsKey(userId), sessionId);
        return true;
    }

    public void revokeOtherSessions(UUID userId, String currentSessionId) {
        Set<String> sessionIds = setCommands().smembers(userSessionsKey(userId));
        if (sessionIds == null) {
            return;
        }
        for (String sessionId : new HashSet<>(sessionIds)) {
            if (!sessionId.equals(currentSessionId)) {
                revokeSession(userId, sessionId);
            }
        }
    }

    public void revokeAllSessions(UUID userId) {
        if (userId == null) {
            return;
        }
        Set<String> sessionIds = setCommands().smembers(userSessionsKey(userId));
        if (sessionIds != null) {
            for (String sessionId : sessionIds) {
                keyCommands().del(sessionKey(sessionId));
            }
        }
        keyCommands().del(userSessionsKey(userId));
    }

    public boolean isSessionActive(UUID userId, String sessionId) {
        if (userId == null || sessionId == null) {
            return false;
        }
        String json = valueCommands().get(sessionKey(sessionId));
        if (json == null) {
            return false;
        }
        SessionInfo session = deserialize(json);
        return session != null && userId.equals(session.getUserId());
    }

    private String serialize(SessionInfo session) {
        try {
            return objectMapper.writeValueAsString(session);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to serialize session", e);
        }
    }

    private SessionInfo deserialize(String json) {
        try {
            return objectMapper.readValue(json, SessionInfo.class);
        } catch (Exception e) {
            return null;
        }
    }

    private String sessionKey(String sessionId) {
        return "session:" + sessionId;
    }

    private String userSessionsKey(UUID userId) {
        return "user:" + userId + ":sessions";
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }

    private SetCommands<String, String> setCommands() {
        return redis.set(String.class);
    }

    private KeyCommands<String> keyCommands() {
        return redis.key(String.class);
    }
}
