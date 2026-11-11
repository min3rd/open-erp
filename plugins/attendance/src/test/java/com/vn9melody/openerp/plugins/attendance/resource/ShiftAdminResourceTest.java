package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.DeviceType;
import com.vn9melody.openerp.plugins.attendance.service.KioskSecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ShiftAdminResourceTest {

    private ShiftAdminResource resource;
    private TestDataClient testDataClient;

    static class TestDataClient extends PluginDataClient {
        final List<Map<String, ?>> writeCalls = new ArrayList<>();

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            writeCalls.add(params != null ? new HashMap<>(params) : Map.of());
            return new PluginQueryResult(List.of(Map.of("id", UUID.randomUUID().toString())), 1, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        resource = new ShiftAdminResource();
        testDataClient = new TestDataClient();

        Field clientField = ShiftAdminResource.class.getDeclaredField("client");
        clientField.setAccessible(true);
        clientField.set(resource, testDataClient);

        Field secField = ShiftAdminResource.class.getDeclaredField("securityService");
        secField.setAccessible(true);
        secField.set(resource, new KioskSecurityService());
    }

    @Test
    @DisplayName("Create shift with equal start and end time throws ATTENDANCE_SHIFT_INVALID_TIME")
    void createShiftEqualTimesThrows() {
        ShiftDto dto = new ShiftDto(
                null, "CA_ERROR", "Ca loi", null,
                LocalTime.of(8, 0), LocalTime.of(8, 0),
                0, 0, 0, 0, 15, 480, true, null, null
        );

        ApiException ex = assertThrows(ApiException.class, () -> resource.createShift(dto));
        assertEquals(AttendanceErrorCode.ATTENDANCE_SHIFT_INVALID_TIME, ex.getErrorCode());
    }

    @Test
    @DisplayName("Create valid shift succeeds with ATTENDANCE_SHIFT_CREATED")
    void createValidShiftSucceeds() {
        ShiftDto dto = new ShiftDto(
                null, "CA_SANG", "Ca sang", null,
                LocalTime.of(8, 0), LocalTime.of(12, 0),
                15, 15, 0, 15, 15, 240, true, null, null
        );

        ApiResponse<ShiftDto> resp = resource.createShift(dto);
        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_SHIFT_CREATED, resp.getCode());
        assertEquals("CA_SANG", resp.getData().code());
    }

    @Test
    @DisplayName("Create device hashes PIN and returns ATTENDANCE_DEVICE_CREATED")
    void createDeviceHashesPin() {
        DeviceCreateRequest req = new DeviceCreateRequest(
                "Kiosk Sanh", DeviceType.KIOSK, UUID.randomUUID(), "KIOSK_SANH_1", "123456", null
        );

        ApiResponse<DeviceResponse> resp = resource.createDevice(req);
        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_DEVICE_CREATED, resp.getCode());
        assertEquals("KIOSK_SANH_1", resp.getData().deviceCode());

        assertFalse(testDataClient.writeCalls.isEmpty());
        String pinHash = (String) testDataClient.writeCalls.get(0).get("pin_hash");
        assertNotNull(pinHash);
        assertTrue(pinHash.contains("$"), "PIN must be hashed with salt");
    }
}

