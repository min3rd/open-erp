package com.vn9melody.openerp.modules.attendance.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AttendanceIngestResourceTest {

    private AttendanceIngestResource resource;

    @BeforeEach
    void setUp() {
        resource = new AttendanceIngestResource();
        resource.replayWindowSeconds = 300;
        resource.rateLimitPerMinute = 120;
    }

    @Test
    @DisplayName("Missing secret throws 401 ATTENDANCE_INGEST_AUTH_FAILED")
    void missingSecretThrowsAuthFailed() {
        ApiException ex = assertThrows(ApiException.class, () ->
                resource.ingest("DEV01", null, String.valueOf(Instant.now().getEpochSecond()), "nonce-1", null)
        );
        assertEquals(AttendanceIngestResource.CODE_AUTH_FAILED, ex.getErrorCode());
        assertEquals(401, ex.getStatusCode());
    }

    @Test
    @DisplayName("Missing timestamp or nonce throws 400 ATTENDANCE_INGEST_REPLAY")
    void missingTimestampOrNonceThrowsReplay() {
        ApiException ex1 = assertThrows(ApiException.class, () ->
                resource.ingest("DEV01", "secret", null, "nonce-1", null)
        );
        assertEquals(AttendanceIngestResource.CODE_REPLAY, ex1.getErrorCode());

        ApiException ex2 = assertThrows(ApiException.class, () ->
                resource.ingest("DEV01", "secret", String.valueOf(Instant.now().getEpochSecond()), null, null)
        );
        assertEquals(AttendanceIngestResource.CODE_REPLAY, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Skewed timestamp (> 300s) throws 400 ATTENDANCE_INGEST_REPLAY")
    void timestampSkewExceedsWindowThrowsReplay() {
        long oldTimestamp = Instant.now().minusSeconds(600).getEpochSecond();
        ApiException ex = assertThrows(ApiException.class, () ->
                resource.ingest("DEV01", "secret", String.valueOf(oldTimestamp), "nonce-old", null)
        );
        assertEquals(AttendanceIngestResource.CODE_REPLAY, ex.getErrorCode());
        assertEquals(400, ex.getStatusCode());
    }

    @Test
    @DisplayName("Valid ingest request returns 200 ATTENDANCE_INGEST_SUCCESS")
    void validIngestSucceeds() {
        long nowSeconds = Instant.now().getEpochSecond();
        AttendanceIngestResource.IngestEvent ev1 = new AttendanceIngestResource.IngestEvent(
                "EMP001", "IN", Instant.now().toString(), Map.of()
        );
        AttendanceIngestResource.IngestRequest req = new AttendanceIngestResource.IngestRequest(List.of(ev1));

        ApiResponse<AttendanceIngestResource.IngestResult> resp = resource.ingest(
                "DEV01", "secret", String.valueOf(nowSeconds), "nonce-" + nowSeconds, req
        );

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceIngestResource.CODE_INGEST_SUCCESS, resp.getCode());
        assertEquals(1, resp.getData().inserted());
    }
}

