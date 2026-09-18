package com.vn9melody.openerp.core.security;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.keys.RedisKeyNotFoundException;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.UUID;

@ApplicationScoped
public class VerificationOtpService {
    private static final long OTP_TTL_SECONDS = 900; // 15 minutes
    private static final long RESEND_TTL_SECONDS = 60; // 60 seconds rate limit
    private static final int OTP_BOUND = 1_000_000;

    private final SecureRandom secureRandom = new SecureRandom();

    @Inject
    RedisDataSource redis;

    @Inject
    TotpService totpService;

    public String issueOtp(UUID userId) {
        String otp = String.format("%06d", secureRandom.nextInt(OTP_BOUND));
        valueCommands().setex(otpKey(userId), OTP_TTL_SECONDS, totpService.sha256Hex(otp));
        return otp;
    }

    public boolean verifyOtp(UUID userId, String code) {
        if (userId == null || code == null || code.isBlank()) {
            return false;
        }
        String storedHash = valueCommands().get(otpKey(userId));
        if (storedHash == null) {
            return false;
        }
        String candidateHash = totpService.sha256Hex(code.trim());
        if (!MessageDigest.isEqual(
                storedHash.getBytes(StandardCharsets.UTF_8),
                candidateHash.getBytes(StandardCharsets.UTF_8))) {
            return false;
        }
        keyCommands().del(otpKey(userId));
        return true;
    }

    public void deleteOtp(UUID userId) {
        if (userId != null) {
            keyCommands().del(otpKey(userId));
        }
    }

    public boolean canResend(UUID userId) {
        return valueCommands().get(resendKey(userId)) == null;
    }

    public void markResent(UUID userId) {
        valueCommands().setex(resendKey(userId), RESEND_TTL_SECONDS, "1");
    }

    public long getResendRemainingSeconds(UUID userId) {
        try {
            long ttl = keyCommands().ttl(resendKey(userId));
            return ttl > 0 ? ttl : 0;
        } catch (RedisKeyNotFoundException e) {
            return 0;
        }
    }

    private String otpKey(UUID userId) {
        return "otp:verify:" + userId;
    }

    private String resendKey(UUID userId) {
        return "otp:resend:" + userId;
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }

    private KeyCommands<String> keyCommands() {
        return redis.key(String.class);
    }
}
