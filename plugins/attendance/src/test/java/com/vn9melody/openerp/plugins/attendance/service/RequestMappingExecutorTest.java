package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.LeaveTypeDto;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.RequestDto;
import com.vn9melody.openerp.plugins.attendance.model.ApprovalMode;
import com.vn9melody.openerp.plugins.attendance.model.MappingStatus;
import com.vn9melody.openerp.plugins.attendance.model.RequestStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class RequestMappingExecutorTest {

    private RequestMappingExecutor executor;
    private LeaveLedgerService leaveLedgerService;
    private TestDataClient client;
    private UUID empId;

    static class TestDataClient extends PluginDataClient {
        final List<Map<String, Object>> records = new ArrayList<>();
        final List<Map<String, Object>> otWindows = new ArrayList<>();
        final List<Map<String, Object>> logs = new ArrayList<>();
        final List<Map<String, Object>> assignments = new ArrayList<>();
        final List<Map<String, Object>> leaveLedger = new ArrayList<>();
        final List<Map<String, Object>> leaveTypes = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            if ("attendance.leave_type.list".equals(queryId)) return new PluginQueryResult(leaveTypes, leaveTypes.size(), 0);
            if ("attendance.leave_type.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : leaveTypes) if (id.equals(r.get("id"))) return new PluginQueryResult(List.of(r), 1, 0);
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.leave_ledger.list".equals(queryId)) return new PluginQueryResult(leaveLedger, leaveLedger.size(), 0);
            return new PluginQueryResult(List.of(), 0, 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            if ("attendance.leave_ledger.insert".equals(queryId)) {
                leaveLedger.add(new LinkedHashMap<>(params));
            }
            if ("attendance.record.upsert".equals(queryId)) {
                records.add(new LinkedHashMap<>(params));
            }
            if ("attendance.ot_window.insert".equals(queryId)) {
                otWindows.add(new LinkedHashMap<>(params));
            }
            if ("attendance.log.insert".equals(queryId)) {
                logs.add(new LinkedHashMap<>(params));
            }
            if ("attendance.assignment.insert".equals(queryId)) {
                assignments.add(new LinkedHashMap<>(params));
            }
            return new PluginQueryResult(List.of(Map.of("id", UUID.randomUUID().toString())), 1, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        client = new TestDataClient();
        empId = UUID.randomUUID();

        leaveLedgerService = new LeaveLedgerService();
        Field lf = leaveLedgerService.getClass().getDeclaredField("client");
        lf.setAccessible(true);
        lf.set(leaveLedgerService, client);

        executor = new RequestMappingExecutor();
        Field cf = executor.getClass().getDeclaredField("client");
        cf.setAccessible(true);
        cf.set(executor, client);

        Field lsf = executor.getClass().getDeclaredField("leaveLedgerService");
        lsf.setAccessible(true);
        lsf.set(executor, leaveLedgerService);
    }

    @Test
    @DisplayName("Mapping LEAVE request updates ledger and records")
    void testMapLeave() {
        UUID ltId = UUID.randomUUID();
        client.leaveTypes.add(Map.of(
                "id", ltId, "code", "ANNUAL", "name", "Phép năm",
                "paid", true, "counts_as_work", true, "deduct_balance", true,
                "allow_negative", false, "is_active", true
        ));

        RequestDto req = new RequestDto(
                UUID.randomUUID(), "REQ-01", ltId, "LEAVE", "Nghỉ phép",
                empId, "An", empId, 1,
                Map.of("leave_type_id", ltId.toString(), "days", 1.0, "start_date", "2026-11-05", "end_date", "2026-11-05"),
                RequestStatus.APPROVED, null, ApprovalMode.INTERNAL_FALLBACK,
                null, null, Map.of(), MappingStatus.PENDING, null, Instant.now(), Instant.now()
        );

        boolean ok = executor.executeMapping(req);
        assertTrue(ok);
        assertEquals(1, client.leaveLedger.size());
        assertEquals(1, client.records.size());
        assertEquals("ON_LEAVE", client.records.get(0).get("status"));
    }

    @Test
    @DisplayName("Mapping OVERTIME request creates OT window")
    void testMapOvertime() {
        RequestDto req = new RequestDto(
                UUID.randomUUID(), "REQ-02", UUID.randomUUID(), "OVERTIME", "Làm thêm giờ",
                empId, "An", empId, 1,
                Map.of("work_date", "2026-11-05"),
                RequestStatus.APPROVED, null, ApprovalMode.INTERNAL_FALLBACK,
                null, null, Map.of(), MappingStatus.PENDING, null, Instant.now(), Instant.now()
        );

        boolean ok = executor.executeMapping(req);
        assertTrue(ok);
        assertEquals(1, client.otWindows.size());
    }

    @Test
    @DisplayName("Mapping ATTENDANCE_FIX request inserts manual log")
    void testMapAttendanceFix() {
        RequestDto req = new RequestDto(
                UUID.randomUUID(), "REQ-03", UUID.randomUUID(), "ATTENDANCE_FIX", "Giải trình công",
                empId, "An", empId, 1,
                Map.of("work_date", "2026-11-05", "event_type", "IN"),
                RequestStatus.APPROVED, null, ApprovalMode.INTERNAL_FALLBACK,
                null, null, Map.of(), MappingStatus.PENDING, null, Instant.now(), Instant.now()
        );

        boolean ok = executor.executeMapping(req);
        assertTrue(ok);
        assertEquals(1, client.logs.size());
        assertEquals("MANUAL", client.logs.get(0).get("source"));
    }

    @Test
    @DisplayName("Mapping BUSINESS_TRIP request updates records")
    void testMapBusinessTrip() {
        RequestDto req = new RequestDto(
                UUID.randomUUID(), "REQ-04", UUID.randomUUID(), "BUSINESS_TRIP", "Đi công tác",
                empId, "An", empId, 1,
                Map.of("start_date", "2026-11-05", "end_date", "2026-11-06"),
                RequestStatus.APPROVED, null, ApprovalMode.INTERNAL_FALLBACK,
                null, null, Map.of(), MappingStatus.PENDING, null, Instant.now(), Instant.now()
        );

        boolean ok = executor.executeMapping(req);
        assertTrue(ok);
        assertEquals(2, client.records.size());
        assertEquals("BUSINESS_TRIP", client.records.get(0).get("status"));
    }
}

