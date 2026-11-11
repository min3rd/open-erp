package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class TimesheetServiceTest {

    private TimesheetService timesheetService;
    private ExportTemplateService exportTemplateService;
    private TestDataClient client;
    private TestTenantContext tenantContext;
    private UUID currentUserId;

    static class TestTenantContext extends TenantContext {
        UUID stubUserId;

        @Override
        public UUID userId() {
            return stubUserId;
        }
    }

    static class TestDataClient extends PluginDataClient {
        final Map<String, List<Map<String, Object>>> tables = new HashMap<>();
        final List<Map<String, ?>> writeCalls = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            List<Map<String, Object>> rows = tables.getOrDefault(queryId, List.of());
            if ("attendance.timesheet.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                List<Map<String, Object>> all = tables.getOrDefault("timesheets", List.of());
                for (Map<String, Object> r : all) {
                    if (id.equals(r.get("id"))) {
                        return new PluginQueryResult(List.of(r), 1, 0);
                    }
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.timesheet.get_by_period".equals(queryId)) {
                String scopeType = (String) params.get("scope_type");
                int year = (int) params.get("period_year");
                int month = (int) params.get("period_month");
                List<Map<String, Object>> all = tables.getOrDefault("timesheets", List.of());
                for (Map<String, Object> r : all) {
                    if (scopeType.equals(r.get("scope_type"))
                            && Objects.equals(year, r.get("period_year"))
                            && Objects.equals(month, r.get("period_month"))) {
                        return new PluginQueryResult(List.of(r), 1, 0);
                    }
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.timesheet.list".equals(queryId)) {
                List<Map<String, Object>> all = tables.getOrDefault("timesheets", List.of());
                return new PluginQueryResult(all, all.size(), 0);
            }
            if ("attendance.confirmation.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                List<Map<String, Object>> all = tables.getOrDefault("confirmations", List.of());
                for (Map<String, Object> r : all) {
                    if (id.equals(r.get("id"))) {
                        return new PluginQueryResult(List.of(r), 1, 0);
                    }
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.confirmation.list".equals(queryId)) {
                UUID tsId = (UUID) params.get("timesheet_id");
                List<Map<String, Object>> all = tables.getOrDefault("confirmations", List.of());
                List<Map<String, Object>> matched = new ArrayList<>();
                for (Map<String, Object> r : all) {
                    if (tsId.equals(r.get("timesheet_id"))) {
                        matched.add(r);
                    }
                }
                return new PluginQueryResult(matched, matched.size(), 0);
            }
            if ("attendance.record.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                List<Map<String, Object>> all = tables.getOrDefault("records", List.of());
                for (Map<String, Object> r : all) {
                    if (id.equals(r.get("id"))) {
                        return new PluginQueryResult(List.of(r), 1, 0);
                    }
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.record.list_range".equals(queryId)) {
                return new PluginQueryResult(tables.getOrDefault("records", List.of()), tables.getOrDefault("records", List.of()).size(), 0);
            }
            if ("attendance.employee_ref.list_all".equals(queryId)) {
                return new PluginQueryResult(tables.getOrDefault("employees", List.of()), tables.getOrDefault("employees", List.of()).size(), 0);
            }
            return new PluginQueryResult(rows, rows.size(), 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            writeCalls.add(params != null ? new HashMap<>(params) : Map.of());
            if ("attendance.timesheet.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                row.put("created_at", Instant.now().toString());
                row.put("updated_at", Instant.now().toString());
                tables.computeIfAbsent("timesheets", k -> new ArrayList<>()).add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.timesheet.update_step".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : tables.getOrDefault("timesheets", List.of())) {
                    if (id.equals(r.get("id"))) {
                        r.put("step", params.get("step"));
                        if (params.containsKey("snapshot")) r.put("snapshot", params.get("snapshot"));
                        r.put("updated_at", params.get("updated_at"));
                    }
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.timesheet.lock".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : tables.getOrDefault("timesheets", List.of())) {
                    if (id.equals(r.get("id"))) {
                        r.put("locked_at", params.get("locked_at"));
                        r.put("locked_by", params.get("locked_by"));
                    }
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.timesheet.unlock".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : tables.getOrDefault("timesheets", List.of())) {
                    if (id.equals(r.get("id"))) {
                        r.put("locked_at", null);
                        r.put("locked_by", null);
                        r.put("unlocked_at", params.get("unlocked_at"));
                        r.put("unlocked_by", params.get("unlocked_by"));
                        r.put("unlock_reason", params.get("unlock_reason"));
                    }
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.confirmation.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                row.put("sent_at", Instant.now().toString());
                tables.computeIfAbsent("confirmations", k -> new ArrayList<>()).add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.confirmation.update".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : tables.getOrDefault("confirmations", List.of())) {
                    if (id.equals(r.get("id"))) {
                        r.put("status", params.get("status"));
                        r.put("comment", params.get("comment"));
                        r.put("acted_at", params.get("acted_at"));
                        r.put("acted_by", params.get("acted_by"));
                    }
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.record.update_by_timesheet".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : tables.getOrDefault("records", List.of())) {
                    if (id.equals(r.get("id"))) {
                        if (params.containsKey("status")) r.put("status", params.get("status"));
                        if (params.containsKey("worked_minutes")) r.put("worked_minutes", params.get("worked_minutes"));
                        r.put("is_override", true);
                        r.put("override_reason", params.get("override_reason"));
                        r.put("override_by", params.get("override_by"));
                    }
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            return new PluginQueryResult(List.of(Map.of("id", UUID.randomUUID().toString())), 1, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        client = new TestDataClient();
        tenantContext = new TestTenantContext();
        currentUserId = UUID.randomUUID();
        tenantContext.stubUserId = currentUserId;
        ObjectMapper objectMapper = new ObjectMapper();

        exportTemplateService = new ExportTemplateService();
        setField(exportTemplateService, "client", client);
        setField(exportTemplateService, "tenantContext", tenantContext);
        setField(exportTemplateService, "objectMapper", objectMapper);

        timesheetService = new TimesheetService();
        setField(timesheetService, "client", client);
        setField(timesheetService, "tenantContext", tenantContext);
        setField(timesheetService, "objectMapper", objectMapper);
        setField(timesheetService, "exportTemplateService", exportTemplateService);
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    @Test
    @DisplayName("Create timesheet: happy path and validation errors")
    void testCreateTimesheet() {
        TimesheetCreateRequest req = new TimesheetCreateRequest(
                2026, 11, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID
        );

        TimesheetDto created = timesheetService.createTimesheet(currentUserId, req);
        assertNotNull(created);
        assertEquals(2026, created.periodYear());
        assertEquals(11, created.periodMonth());
        assertEquals(TimesheetStep.S1_LOGS, created.step());

        // Duplicate timesheet throws 409
        ApiException ex = assertThrows(ApiException.class, () -> timesheetService.createTimesheet(currentUserId, req));
        assertEquals(409, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_DUPLICATED, ex.getErrorCode());

        // Invalid month throws 400
        TimesheetCreateRequest invalidMonth = new TimesheetCreateRequest(
                2026, 13, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID
        );
        ApiException ex2 = assertThrows(ApiException.class, () -> timesheetService.createTimesheet(currentUserId, invalidMonth));
        assertEquals(400, ex2.getStatusCode());
    }

    @Test
    @DisplayName("Timesheet 4-step lifecycle: S1 -> S2 -> S3 (calculate snapshot) -> S4 -> DONE")
    void testTimesheetLifecycle() {
        // Seed employee and record
        UUID empId = UUID.randomUUID();
        Map<String, Object> empRow = new LinkedHashMap<>();
        empRow.put("employee_id", empId.toString());
        empRow.put("employee_code", "EMP001");
        empRow.put("full_name", "Nguyễn Văn A");
        client.tables.computeIfAbsent("employees", k -> new ArrayList<>()).add(empRow);

        UUID recordId = UUID.randomUUID();
        Map<String, Object> recRow = new LinkedHashMap<>();
        recRow.put("id", recordId);
        recRow.put("employee_id", empId);
        recRow.put("work_date", "2026-11-02");
        recRow.put("status", "PRESENT");
        recRow.put("worked_minutes", 480);
        recRow.put("late_minutes", 0);
        recRow.put("ot_minutes", 60);
        recRow.put("is_override", false);
        client.tables.computeIfAbsent("records", k -> new ArrayList<>()).add(recRow);

        TimesheetCreateRequest req = new TimesheetCreateRequest(
                2026, 11, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID
        );
        TimesheetDto ts = timesheetService.createTimesheet(currentUserId, req);
        assertEquals(TimesheetStep.S1_LOGS, ts.step());

        // Step 1 -> Step 2
        ts = timesheetService.transitionStep(ts.id(), currentUserId, new TimesheetStepRequest(TimesheetStep.S2_SCHEDULE, false));
        assertEquals(TimesheetStep.S2_SCHEDULE, ts.step());

        // Step 2 -> Step 3 (Calculates snapshot)
        ts = timesheetService.transitionStep(ts.id(), currentUserId, new TimesheetStepRequest(TimesheetStep.S3_CALCULATE, false));
        assertEquals(TimesheetStep.S3_CALCULATE, ts.step());
        assertNotNull(ts.snapshot());
        assertEquals(1, ts.snapshot().get("total_employees"));

        // Step 3 -> Step 4
        ts = timesheetService.transitionStep(ts.id(), currentUserId, new TimesheetStepRequest(TimesheetStep.S4_ADJUST, false));
        assertEquals(TimesheetStep.S4_ADJUST, ts.step());

        // S4 adjustment: update record with reason
        timesheetService.updateRecordInStep4(ts.id(), recordId, currentUserId,
                new TimesheetRecordUpdateRequest(AttendanceStatus.PRESENT, 500, "Bổ sung công họp"));

        UUID currentTsId = ts.id();
        // Regressing to Step 1 without confirm_override_loss throws 409
        ApiException ex = assertThrows(ApiException.class, () ->
                timesheetService.transitionStep(currentTsId, currentUserId, new TimesheetStepRequest(TimesheetStep.S1_LOGS, false))
        );
        assertEquals(409, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_OVERRIDE_LOSS, ex.getErrorCode());

        // Regressing with confirm_override_loss = true succeeds
        ts = timesheetService.transitionStep(ts.id(), currentUserId, new TimesheetStepRequest(TimesheetStep.S1_LOGS, true));
        assertEquals(TimesheetStep.S1_LOGS, ts.step());

        // Move to DONE
        ts = timesheetService.transitionStep(ts.id(), currentUserId, new TimesheetStepRequest(TimesheetStep.DONE, false));
        assertEquals(TimesheetStep.DONE, ts.step());
    }

    @Test
    @DisplayName("Send confirmations and employee act (CONFIRM / REJECT)")
    void testConfirmations() {
        UUID empId = UUID.randomUUID();
        client.tables.computeIfAbsent("employees", k -> new ArrayList<>()).add(Map.of(
                "employee_id", empId.toString(),
                "employee_code", "EMP002",
                "full_name", "Trần Thị B"
        ));

        TimesheetDto ts = timesheetService.createTimesheet(currentUserId,
                new TimesheetCreateRequest(2026, 11, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID));

        int sent = timesheetService.sendConfirmations(ts.id(), currentUserId, new SendConfirmationsRequest(List.of(empId)));
        assertEquals(1, sent);

        List<TimesheetConfirmationDto> list = timesheetService.listConfirmations(ts.id(), null);
        assertEquals(1, list.size());
        assertEquals(TimesheetConfirmationStatus.PENDING, list.get(0).status());

        // Employee confirms
        UUID confId = list.get(0).id();
        TimesheetConfirmationDto acted = timesheetService.actOnConfirmation(confId, empId,
                new TimesheetConfirmationActionRequest(TimesheetConfirmationStatus.CONFIRMED, "Đồng ý số công"));
        assertEquals(TimesheetConfirmationStatus.CONFIRMED, acted.status());
        assertEquals("Đồng ý số công", acted.comment());

        // Acting again throws 400
        ApiException ex = assertThrows(ApiException.class, () ->
                timesheetService.actOnConfirmation(confId, empId,
                        new TimesheetConfirmationActionRequest(TimesheetConfirmationStatus.REJECTED, "Thay đổi ý kiến"))
        );
        assertEquals(400, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_CONFIRMATION_CLOSED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lock and unlock timesheet lifecycle")
    void testLockAndUnlockTimesheet() {
        TimesheetDto ts = timesheetService.createTimesheet(currentUserId,
                new TimesheetCreateRequest(2026, 11, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID));

        UUID tsId = ts.id();
        // Locking before DONE throws 400
        ApiException ex = assertThrows(ApiException.class, () -> timesheetService.lockTimesheet(tsId, currentUserId));
        assertEquals(400, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_NOT_DONE, ex.getErrorCode());

        // Move to DONE
        ts = timesheetService.transitionStep(tsId, currentUserId, new TimesheetStepRequest(TimesheetStep.DONE, false));

        // Lock timesheet
        ts = timesheetService.lockTimesheet(tsId, currentUserId);
        assertNotNull(ts.lockedAt());
        assertEquals(currentUserId, ts.lockedBy());

        // Unlock without reason throws 400
        ApiException ex2 = assertThrows(ApiException.class, () -> timesheetService.unlockTimesheet(tsId, currentUserId, ""));
        assertEquals(400, ex2.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR, ex2.getErrorCode());

        // Unlock with reason succeeds
        ts = timesheetService.unlockTimesheet(tsId, currentUserId, "Sửa sai sót danh sách thưởng");
        assertNull(ts.lockedAt());
        assertNotNull(ts.unlockedAt());
        assertEquals("Sửa sai sót danh sách thưởng", ts.unlockReason());
    }

    @Test
    @DisplayName("Export timesheet to payroll-ready CSV")
    void testExportTimesheet() {
        UUID empId = UUID.randomUUID();
        client.tables.computeIfAbsent("employees", k -> new ArrayList<>()).add(Map.of(
                "employee_id", empId.toString(),
                "employee_code", "EMP003",
                "full_name", "Lê Văn C"
        ));

        TimesheetDto ts = timesheetService.createTimesheet(currentUserId,
                new TimesheetCreateRequest(2026, 11, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID));
        ts = timesheetService.transitionStep(ts.id(), currentUserId, new TimesheetStepRequest(TimesheetStep.S3_CALCULATE, false));

        TimesheetExportResponse export = timesheetService.exportTimesheet(ts.id(), null);
        assertNotNull(export);
        assertEquals("text/csv", export.contentType());
        assertTrue(export.filename().contains("timesheet_2026_11.csv"));
        assertTrue(export.content().contains("Mã nhân viên"));
        assertTrue(export.content().contains("EMP003"));
    }
}
