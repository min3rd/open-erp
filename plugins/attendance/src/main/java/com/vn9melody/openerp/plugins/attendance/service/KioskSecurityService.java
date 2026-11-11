package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import jakarta.enterprise.context.ApplicationScoped;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Security service for Attendance Kiosk authentication, PIN hashing, brute force lockout,
 * and 5-minute session tokens (ADR-S09-005 §2.1).
 */
@ApplicationScoped
public class KioskSecurityService {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);
    public static final Duration SESSION_TTL = Duration.ofMinutes(5);

    private final SecureRandom secureRandom = new SecureRandom();

    // In-memory state tracking per device
    private final Map<UUID, Integer> failedAttempts = new ConcurrentHashMap<>();
    private final Map<UUID, Instant> lockouts = new ConcurrentHashMap<>();

    // Active kiosk sessions: sessionToken -> KioskSession
    private final Map<String, KioskSession> activeSessions = new ConcurrentHashMap<>();

    public record KioskSession(
            String sessionToken,
            UUID deviceId,
            UUID tenantId,
            String employeeCode,
            UUID employeeId,
            String employeeName,
            Instant expiresAt
    ) {
        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    /**
     * Checks if the device is currently locked due to too many failed PIN attempts.
     */
    public boolean isDeviceLocked(UUID deviceId, Instant persistentLockedUntil) {
        Instant now = Instant.now();
        Instant inMemLock = lockouts.get(deviceId);
        if (inMemLock != null && inMemLock.isAfter(now)) {
            return true;
        }
        return persistentLockedUntil != null && persistentLockedUntil.isAfter(now);
    }

    /**
     * Authenticates an employee PIN on a kiosk device.
     */
    public KioskSession authenticate(UUID deviceId, UUID tenantId, String employeeCode,
                                     String pin, String expectedPinHash, Instant persistentLockedUntil,
                                     UUID employeeId, String employeeName) {
        if (isDeviceLocked(deviceId, persistentLockedUntil)) {
            throw new ApiException(423, AttendanceErrorCode.KIOSK_DEVICE_LOCKED,
                    "Kiosk device is temporarily locked due to too many failed attempts",
                    Map.of("device_id", deviceId.toString()));
        }

        if (pin == null || expectedPinHash == null || !verifyPin(pin, expectedPinHash)) {
            int currentFails = failedAttempts.compute(deviceId, (k, v) -> (v == null ? 1 : v + 1));
            if (currentFails >= MAX_FAILED_ATTEMPTS) {
                Instant lockUntil = Instant.now().plus(LOCKOUT_DURATION);
                lockouts.put(deviceId, lockUntil);
                throw new ApiException(423, AttendanceErrorCode.KIOSK_DEVICE_LOCKED,
                        "Too many failed PIN attempts. Kiosk device locked for 15 minutes",
                        Map.of("device_id", deviceId.toString(), "locked_until", lockUntil.toString()));
            }
            throw new ApiException(401, AttendanceErrorCode.KIOSK_AUTH_FAILED,
                    "Invalid employee code or PIN",
                    Map.of("employee_code", employeeCode, "remaining_attempts", MAX_FAILED_ATTEMPTS - currentFails));
        }

        // Authentication succeeded: reset failure counter
        failedAttempts.remove(deviceId);
        lockouts.remove(deviceId);

        // Issue 5-minute session token
        String sessionToken = generateSecureToken();
        Instant expiresAt = Instant.now().plus(SESSION_TTL);
        KioskSession session = new KioskSession(
                sessionToken,
                deviceId,
                tenantId,
                employeeCode,
                employeeId,
                employeeName,
                expiresAt
        );

        activeSessions.put(sessionToken, session);
        return session;
    }

    /**
     * Validates a kiosk session token.
     */
    public KioskSession validateSession(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new ApiException(401, AttendanceErrorCode.KIOSK_SESSION_EXPIRED,
                    "Kiosk session token is missing or expired", Map.of());
        }

        KioskSession session = activeSessions.get(sessionToken);
        if (session == null || session.isExpired()) {
            if (session != null) {
                activeSessions.remove(sessionToken);
            }
            throw new ApiException(401, AttendanceErrorCode.KIOSK_SESSION_EXPIRED,
                    "Kiosk session has expired. Please authenticate again", Map.of());
        }

        return session;
    }

    /**
     * Consumes or invalidates the kiosk session after punch.
     */
    public void invalidateSession(String sessionToken) {
        if (sessionToken != null) {
            activeSessions.remove(sessionToken);
        }
    }

    /**
     * Hashes a 4-8 digit numeric or alphanumeric PIN using SHA-256 with salt.
     */
    public String hashPin(String pin) {
        if (pin == null || pin.isBlank()) {
            throw new IllegalArgumentException("PIN cannot be empty");
        }
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);
        String saltHex = HexFormat.of().formatHex(salt);
        String hashHex = sha256(saltHex + ":" + pin.trim());
        return saltHex + "$" + hashHex;
    }

    /**
     * Verifies a plain PIN against a stored salted hash.
     */
    public boolean verifyPin(String pin, String storedHash) {
        if (pin == null || storedHash == null || !storedHash.contains("$")) {
            return false;
        }
        String[] parts = storedHash.split("\\$");
        if (parts.length != 2) {
            return false;
        }
        String saltHex = parts[0];
        String expectedHash = parts[1];
        String actualHash = sha256(saltHex + ":" + pin.trim());
        return MessageDigest.isEqual(
                actualHash.getBytes(StandardCharsets.UTF_8),
                expectedHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Generates a cryptographically strong 32-byte session token.
     */
    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm missing", e);
        }
    }
}

