package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class KioskSecurityServiceTest {

    private KioskSecurityService service;
    private UUID deviceId;
    private UUID tenantId;
    private UUID employeeId;
    private String employeeCode;
    private String employeeName;
    private String rawPin;
    private String hashedPin;

    @BeforeEach
    void setUp() {
        service = new KioskSecurityService();
        deviceId = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        employeeCode = "EMP001";
        employeeName = "Nguyen Van A";
        rawPin = "123456";
        hashedPin = service.hashPin(rawPin);
    }

    @Test
    @DisplayName("PIN hashing and verification")
    void pinHashingAndVerification() {
        assertNotNull(hashedPin);
        assertTrue(hashedPin.contains("$"));
        assertTrue(service.verifyPin("123456", hashedPin));
        assertFalse(service.verifyPin("654321", hashedPin));
        assertFalse(service.verifyPin("", hashedPin));
        assertFalse(service.verifyPin(null, hashedPin));
    }

    @Test
    @DisplayName("Successful authentication issues 5-minute session token")
    void successfulAuthentication() {
        KioskSecurityService.KioskSession session = service.authenticate(
                deviceId, tenantId, employeeCode, rawPin, hashedPin, null, employeeId, employeeName
        );

        assertNotNull(session);
        assertNotNull(session.sessionToken());
        assertEquals(employeeCode, session.employeeCode());
        assertEquals(employeeName, session.employeeName());
        assertFalse(session.isExpired());

        // Validate session token
        KioskSecurityService.KioskSession validated = service.validateSession(session.sessionToken());
        assertEquals(session.sessionToken(), validated.sessionToken());

        // Invalidate session
        service.invalidateSession(session.sessionToken());
        ApiException ex = assertThrows(ApiException.class, () -> service.validateSession(session.sessionToken()));
        assertEquals(AttendanceErrorCode.KIOSK_SESSION_EXPIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Failed authentication increments counter and throws KIOSK_AUTH_FAILED")
    void failedAuthenticationThrowsAuthFailed() {
        ApiException ex = assertThrows(ApiException.class, () -> service.authenticate(
                deviceId, tenantId, employeeCode, "wrong_pin", hashedPin, null, employeeId, employeeName
        ));

        assertEquals(AttendanceErrorCode.KIOSK_AUTH_FAILED, ex.getErrorCode());
        assertEquals(401, ex.getStatusCode());
    }

    @Test
    @DisplayName("Brute force protection locks device after 5 failed attempts")
    void bruteForceLockoutAfterFiveAttempts() {
        for (int i = 1; i <= 4; i++) {
            assertThrows(ApiException.class, () -> service.authenticate(
                    deviceId, tenantId, employeeCode, "wrong_pin", hashedPin, null, employeeId, employeeName
            ));
        }

        // 5th attempt triggers lockout
        ApiException ex = assertThrows(ApiException.class, () -> service.authenticate(
                deviceId, tenantId, employeeCode, "wrong_pin", hashedPin, null, employeeId, employeeName
        ));
        assertEquals(AttendanceErrorCode.KIOSK_DEVICE_LOCKED, ex.getErrorCode());
        assertEquals(423, ex.getStatusCode());

        // Subsequent attempts (even with correct PIN) are rejected while locked
        ApiException lockedEx = assertThrows(ApiException.class, () -> service.authenticate(
                deviceId, tenantId, employeeCode, rawPin, hashedPin, null, employeeId, employeeName
        ));
        assertEquals(AttendanceErrorCode.KIOSK_DEVICE_LOCKED, lockedEx.getErrorCode());
    }

    @Test
    @DisplayName("Persistent locked_until is respected")
    void persistentLockoutRespected() {
        Instant lockedUntil = Instant.now().plus(10, ChronoUnit.MINUTES);
        ApiException ex = assertThrows(ApiException.class, () -> service.authenticate(
                deviceId, tenantId, employeeCode, rawPin, hashedPin, lockedUntil, employeeId, employeeName
        ));
        assertEquals(AttendanceErrorCode.KIOSK_DEVICE_LOCKED, ex.getErrorCode());
    }
}

