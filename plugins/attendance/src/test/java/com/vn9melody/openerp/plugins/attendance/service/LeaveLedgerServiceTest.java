package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.LeaveLedgerEntryType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class LeaveLedgerServiceTest {

    private LeaveLedgerService service;
    private TestDataClient client;
    private UUID currentUserId;

    static class TestDataClient extends PluginDataClient {
        final List<Map<String, Object>> leaveTypes = new ArrayList<>();
        final List<Map<String, Object>> ledger = new ArrayList<>();
        final List<Map<String, Object>> balances = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            if ("attendance.leave_type.list".equals(queryId)) {
                return new PluginQueryResult(leaveTypes, leaveTypes.size(), 0);
            }
            if ("attendance.leave_type.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : leaveTypes) {
                    if (id.equals(r.get("id"))) return new PluginQueryResult(List.of(r), 1, 0);
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.leave_type.get_by_code".equals(queryId)) {
                String code = (String) params.get("code");
                for (Map<String, Object> r : leaveTypes) {
                    if (code.equalsIgnoreCase((String) r.get("code"))) return new PluginQueryResult(List.of(r), 1, 0);
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.leave_ledger.list".equals(queryId)) {
                UUID empId = (UUID) params.get("employee_id");
                UUID ltId = (UUID) params.get("leave_type_id");
                String entryType = (String) params.get("entry_type");
                List<Map<String, Object>> matched = new ArrayList<>();
                for (Map<String, Object> r : ledger) {
                    boolean ok = true;
                    if (empId != null && !empId.equals(r.get("employee_id"))) ok = false;
                    if (ltId != null && !ltId.equals(r.get("leave_type_id"))) ok = false;
                    if (entryType != null && !entryType.equals(r.get("entry_type"))) ok = false;
                    if (ok) matched.add(r);
                }
                return new PluginQueryResult(matched, matched.size(), 0);
            }
            if ("attendance.leave_balance.list".equals(queryId)) {
                return new PluginQueryResult(balances, balances.size(), 0);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            if ("attendance.leave_type.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                row.put("created_at", Instant.now().toString());
                row.put("updated_at", Instant.now().toString());
                leaveTypes.add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.leave_type.update".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : leaveTypes) {
                    if (id.equals(r.get("id"))) {
                        r.putAll(params);
                    }
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.leave_type.delete".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                leaveTypes.removeIf(r -> id.equals(r.get("id")));
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.leave_ledger.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                row.put("created_at", Instant.now().toString());
                ledger.add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.leave_balance.upsert".equals(queryId)) {
                UUID empId = (UUID) params.get("employee_id");
                UUID ltId = (UUID) params.get("leave_type_id");
                balances.removeIf(b -> empId.equals(b.get("employee_id")) && ltId.equals(b.get("leave_type_id")));
                balances.add(new LinkedHashMap<>(params));
                return new PluginQueryResult(List.of(Map.of("id", UUID.randomUUID().toString())), 1, 1);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        client = new TestDataClient();
        currentUserId = UUID.randomUUID();
        service = new LeaveLedgerService();
        Field cf = service.getClass().getDeclaredField("client");
        cf.setAccessible(true);
        cf.set(service, client);
    }

    @Test
    @DisplayName("LeaveType CRUD")
    void testLeaveTypeCrud() {
        LeaveTypeCreateRequest req = new LeaveTypeCreateRequest(
                "ANNUAL", "Nghỉ phép năm", true, true, true, false, 5, 12, 12.0, true
        );
        LeaveTypeDto created = service.createLeaveType(req);
        assertNotNull(created);
        assertEquals("ANNUAL", created.code());
        assertEquals("Nghỉ phép năm", created.name());
        assertTrue(created.paid());
        assertTrue(created.deductBalance());
        assertFalse(created.allowNegative());

        LeaveTypeDto fetched = service.getLeaveType(created.id());
        assertEquals("ANNUAL", fetched.code());

        LeaveTypeDto updated = service.updateLeaveType(created.id(), new LeaveTypeUpdateRequest(
                "Phép thường niên", true, true, true, false, 10, 12, 14.0, true
        ));
        assertEquals("Phép thường niên", updated.name());
        assertEquals(10, updated.carryOverMaxDays());

        service.deleteLeaveType(created.id());
        assertTrue(service.listLeaveTypes(null).isEmpty());
    }

    @Test
    @DisplayName("Leave Ledger append-only & derive balance: grant, usage, reversal, adjustment, expiry")
    void testLedgerAndDeriveBalance() {
        LeaveTypeDto lt = service.createLeaveType(new LeaveTypeCreateRequest(
                "ANNUAL", "Phép năm", true, true, true, false, 5, 12, 12.0, true
        ));
        UUID empId = UUID.randomUUID();

        // 1. Grant 12 days
        int granted = service.grantLeave(currentUserId, new LeaveGrantRequest(
                List.of(empId), lt.id(), 12.0, LocalDate.now().plusMonths(6), "Cấp phép đầu năm"
        ));
        assertEquals(1, granted);

        LeaveBalanceDto b1 = service.deriveBalance(empId, lt.id());
        assertEquals(12.0, b1.granted());
        assertEquals(0.0, b1.used());
        assertEquals(12.0, b1.remaining());

        // 2. Usage 3 days
        UUID reqId = UUID.randomUUID();
        service.recordUsage(empId, lt.id(), 3.0, reqId);
        LeaveBalanceDto b2 = service.deriveBalance(empId, lt.id());
        assertEquals(12.0, b2.granted());
        assertEquals(3.0, b2.used());
        assertEquals(9.0, b2.remaining());

        // 3. Usage reversal 1 day
        service.reverseUsage(empId, lt.id(), 1.0, reqId);
        LeaveBalanceDto b3 = service.deriveBalance(empId, lt.id());
        assertEquals(2.0, b3.used());
        assertEquals(10.0, b3.remaining());

        // 4. HR adjustment +2 days
        service.adjustLeave(currentUserId, new LeaveAdjustmentRequest(empId, lt.id(), 2.0, "Thưởng thâm niên"));
        LeaveBalanceDto b4 = service.deriveBalance(empId, lt.id());
        assertEquals(12.0, b4.remaining());
    }

    @Test
    @DisplayName("Expiry job expires grants with valid_until < today")
    void testDailyExpiryJob() {
        LeaveTypeDto lt = service.createLeaveType(new LeaveTypeCreateRequest(
                "ANNUAL", "Phép năm", true, true, true, false, 5, 12, 12.0, true
        ));
        UUID empId = UUID.randomUUID();

        // Grant with valid_until in the past
        service.grantLeave(currentUserId, new LeaveGrantRequest(
                List.of(empId), lt.id(), 5.0, LocalDate.now().minusDays(2), "Phép năm cũ"
        ));

        LeaveBalanceDto beforeExpiry = service.deriveBalance(empId, lt.id());
        assertEquals(5.0, beforeExpiry.remaining());

        int expiredCount = service.runDailyExpiryJob();
        assertEquals(1, expiredCount);

        LeaveBalanceDto afterExpiry = service.deriveBalance(empId, lt.id());
        assertEquals(0.0, afterExpiry.remaining());
    }
}

