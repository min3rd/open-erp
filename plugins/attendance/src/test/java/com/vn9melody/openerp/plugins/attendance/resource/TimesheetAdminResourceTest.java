package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.*;
import com.vn9melody.openerp.plugins.attendance.service.ExportTemplateService;
import com.vn9melody.openerp.plugins.attendance.service.TimesheetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class TimesheetAdminResourceTest {

    private TimesheetAdminResource resource;
    private TimesheetConfirmationResource confirmationResource;
    private StubTimesheetService stubTimesheetService;
    private StubExportTemplateService stubExportTemplateService;
    private StubTenantContext stubTenantContext;
    private UUID currentUserId;

    static class StubTenantContext extends TenantContext {
        UUID stubUserId;

        @Override
        public UUID userId() {
            return stubUserId;
        }
    }

    static class StubTimesheetService extends TimesheetService {
        TimesheetDto sampleDto;

        @Override
        public PagedData<TimesheetDto> listTimesheets(Integer year, Integer month, String scopeType, String step, int page, int size) {
            return PagedData.of(List.of(sampleDto), 1, 20, 1);
        }

        @Override
        public TimesheetDto getTimesheet(UUID id) {
            return sampleDto;
        }

        @Override
        public TimesheetDto createTimesheet(UUID createdBy, TimesheetCreateRequest req) {
            return sampleDto;
        }

        @Override
        public TimesheetDto transitionStep(UUID timesheetId, UUID currentUserId, TimesheetStepRequest req) {
            return sampleDto;
        }

        @Override
        public void updateRecordInStep4(UUID timesheetId, UUID recordId, UUID currentUserId, TimesheetRecordUpdateRequest req) {
        }

        @Override
        public int sendConfirmations(UUID timesheetId, UUID currentUserId, SendConfirmationsRequest req) {
            return 5;
        }

        @Override
        public List<TimesheetConfirmationDto> listConfirmations(UUID timesheetId, String status) {
            return List.of(new TimesheetConfirmationDto(
                    UUID.randomUUID(), timesheetId, UUID.randomUUID(), "NV01", "An",
                    TimesheetConfirmationStatus.PENDING, null, Instant.now(), null, null
            ));
        }

        @Override
        public TimesheetConfirmationDto actOnConfirmation(UUID confirmationId, UUID currentUserId, TimesheetConfirmationActionRequest req) {
            return new TimesheetConfirmationDto(
                    confirmationId, UUID.randomUUID(), UUID.randomUUID(), "NV01", "An",
                    req.action(), req.comment(), Instant.now(), Instant.now(), currentUserId
            );
        }

        @Override
        public TimesheetDto lockTimesheet(UUID timesheetId, UUID currentUserId) {
            return sampleDto;
        }

        @Override
        public TimesheetDto unlockTimesheet(UUID timesheetId, UUID currentUserId, String reason) {
            return sampleDto;
        }

        @Override
        public TimesheetExportResponse exportTimesheet(UUID timesheetId, UUID templateId) {
            return new TimesheetExportResponse(UUID.randomUUID(), "ts.csv", "text/csv", "code,name\n01,An");
        }
    }

    static class StubExportTemplateService extends ExportTemplateService {
        ExportTemplateDto sampleTmpl = new ExportTemplateDto(
                UUID.randomUUID(), "Mẫu", List.of(new ExportTemplateColumn("EMPLOYEE_CODE", "Mã", 1, true)),
                true, Instant.now(), Instant.now()
        );

        @Override
        public List<ExportTemplateDto> listTemplates() {
            return List.of(sampleTmpl);
        }

        @Override
        public ExportTemplateDto getTemplate(UUID id) {
            return sampleTmpl;
        }

        @Override
        public ExportTemplateDto createTemplate(ExportTemplateCreateRequest req) {
            return sampleTmpl;
        }

        @Override
        public ExportTemplateDto updateTemplate(UUID id, ExportTemplateUpdateRequest req) {
            return sampleTmpl;
        }

        @Override
        public void deleteTemplate(UUID id) {
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        currentUserId = UUID.randomUUID();
        stubTenantContext = new StubTenantContext();
        stubTenantContext.stubUserId = currentUserId;

        stubTimesheetService = new StubTimesheetService();
        stubTimesheetService.sampleDto = new TimesheetDto(
                UUID.randomUUID(), 2026, 11, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID,
                TimesheetStep.S1_LOGS, null, null, null, null, null, Map.of(), currentUserId, Instant.now(), Instant.now()
        );

        stubExportTemplateService = new StubExportTemplateService();

        resource = new TimesheetAdminResource();
        setField(resource, "timesheetService", stubTimesheetService);
        setField(resource, "exportTemplateService", stubExportTemplateService);
        setField(resource, "tenantContext", stubTenantContext);

        confirmationResource = new TimesheetConfirmationResource();
        setField(confirmationResource, "timesheetService", stubTimesheetService);
        setField(confirmationResource, "tenantContext", stubTenantContext);
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    @Test
    @DisplayName("REST API Timesheet Admin Resource endpoints")
    void testTimesheetAdminEndpoints() {
        ApiResponse<PagedData<TimesheetDto>> listResp = resource.listTimesheets(2026, 11, null, null, 1, 20);
        assertTrue(listResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_LIST_SUCCESS, listResp.getCode());
        assertEquals(1, listResp.getData().getItems().size());

        ApiResponse<TimesheetDto> createResp = resource.createTimesheet(new TimesheetCreateRequest(
                2026, 11, TimesheetScopeType.TENANT, null, WageCalcMode.STANDARD_MINUS_UNPAID
        ));
        assertTrue(createResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_CREATED, createResp.getCode());

        UUID tsId = createResp.getData().id();
        ApiResponse<TimesheetDto> stepResp = resource.transitionStep(tsId, new TimesheetStepRequest(TimesheetStep.S2_SCHEDULE, false));
        assertTrue(stepResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_STEP_SUCCESS, stepResp.getCode());

        ApiResponse<Map<String, Object>> recResp = resource.updateRecord(tsId, UUID.randomUUID(),
                new TimesheetRecordUpdateRequest(AttendanceStatus.PRESENT, 480, "Sửa"));
        assertTrue(recResp.isSuccess());

        ApiResponse<Map<String, Object>> sendResp = resource.sendConfirmations(tsId, new SendConfirmationsRequest(List.of()));
        assertTrue(sendResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_CONFIRMATIONS_SENT, sendResp.getCode());

        ApiResponse<ListData<TimesheetConfirmationDto>> confResp = resource.listConfirmations(tsId, null);
        assertTrue(confResp.isSuccess());
        assertEquals(1, confResp.getData().getItems().size());

        ApiResponse<TimesheetDto> lockResp = resource.lockTimesheet(tsId);
        assertTrue(lockResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_LOCKED, lockResp.getCode());

        ApiResponse<TimesheetDto> unlockResp = resource.unlockTimesheet(tsId, new TimesheetUnlockRequest("Lý do"));
        assertTrue(unlockResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_TIMESHEET_UNLOCKED, unlockResp.getCode());

        ApiResponse<TimesheetExportResponse> exportResp = resource.exportTimesheet(tsId, new TimesheetExportRequest(null));
        assertTrue(exportResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_EXPORT_READY, exportResp.getCode());
    }

    @Test
    @DisplayName("REST API Confirmation Action Resource endpoint")
    void testConfirmationResource() {
        UUID confId = UUID.randomUUID();
        ApiResponse<TimesheetConfirmationDto> actResp = confirmationResource.actOnConfirmation(confId,
                new TimesheetConfirmationActionRequest(TimesheetConfirmationStatus.CONFIRMED, "OK"));
        assertTrue(actResp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_CONFIRMATION_RECORDED, actResp.getCode());
        assertEquals(TimesheetConfirmationStatus.CONFIRMED, actResp.getData().status());
    }

    @Test
    @DisplayName("REST API Export Template endpoints")
    void testExportTemplateEndpoints() {
        ApiResponse<ListData<ExportTemplateDto>> list = resource.listExportTemplates();
        assertTrue(list.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_LIST_SUCCESS, list.getCode());

        UUID id = list.getData().getItems().get(0).id();
        ApiResponse<ExportTemplateDto> get = resource.getExportTemplate(id);
        assertTrue(get.isSuccess());

        ApiResponse<Map<String, Object>> del = resource.deleteExportTemplate(id);
        assertTrue(del.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_DELETED, del.getCode());
    }
}

