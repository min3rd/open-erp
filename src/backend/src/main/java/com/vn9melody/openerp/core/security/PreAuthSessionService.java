package com.vn9melody.openerp.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.UUID;

@ApplicationScoped
public class PreAuthSessionService {
    private static final long PRE_AUTH_TTL_SECONDS = 300; // 5 minutes

    public static class PreAuthSession {
        public UUID userId;
        public String purpose;
        public long attempts;

        public PreAuthSession() {}

        public PreAuthSession(UUID userId, String purpose) {
            this.userId = userId;
            this.purpose = purpose;
            this.attempts = 0;
        }
    }

    @Inject
    RedisDataSource redis;

    @Inject
    ObjectMapper objectMapper;

    public void create(String jti, UUID userId, String purpose) {
        writeSession(jti, new PreAuthSession(userId, purpose));
    }

    public String getPurpose(String jti) {
        PreAuthSession session = readSession(jti);
        return session != null ? session.purpose : null;
    }

    public long incrementAttempts(String jti) {
        PreAuthSession session = readSession(jti);
        if (session == null) {
            return 0;
        }
        session.attempts++;
        writeSession(jti, session);
        return session.attempts;
    }

    public void delete(String jti) {
        if (jti != null) {
            keyCommands().del(preAuthKey(jti));
        }
    }

    private PreAuthSession readSession(String jti) {
        if (jti == null) {
            return null;
        }
        String json = valueCommands().get(preAuthKey(jti));
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, PreAuthSession.class);
        } catch (Exception e) {
            return null;
        }
    }

    private void writeSession(String jti, PreAuthSession session) {
        try {
            valueCommands().setex(preAuthKey(jti), PRE_AUTH_TTL_SECONDS, objectMapper.writeValueAsString(session));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to persist pre-auth session", e);
        }
    }

    private String preAuthKey(String jti) {
        return "preauth:" + jti;
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }

    private KeyCommands<String> keyCommands() {
        return redis.key(String.class);
    }
}
