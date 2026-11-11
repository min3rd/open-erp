package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.LeaveLedgerEntryType;
import com.vn9melody.openerp.plugins.attendance.model.LeaveLedgerSource;
import com.vn9melody.openerp.plugins.attendance.service.LeaveLedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class LeaveAdminResourceTest {

    private LeaveAdminResource resource;
    private StubLeaveLedgerService stubService;
    private StubTenantContext stubTenantContext;
    private UUID currentUserId;

    static class StubTenantContext extends TenantContext {
        UUID stubUserId;

        @Override
        public UUID userId() {
            return stubUserId;
        }
    }

    static class StubLeaveLedgerService extends LeaveLedgerService {
        LeaveTypeDto sampleType = new LeaveTypeDto(
                UUID.randomUUID(), "ANNUAL", "Phép năm", true, true, true, false, 5, 12, 12.0, true, Instant.now(), Instant.now()
        );
        LeaveBalanceDto sampleBalance = new LeaveBalanceDto(
                UUID.randomUUID(), UUID.randomUUID(), "ANNUAL", "Phép năm", 12.0, 2.0, 10.0, 0.0, Instant.now()
        );
        LeaveLedgerEntryDto sampleEntry = new LeaveLedgerEntryDto(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), LeaveLedgerEntryType.GRANT,
                12.0, LocalDate.now().plusMonths(6), null, LeaveLedgerSource.HR, "Cấp đầu năm", UUID.randomUUID(), Instant.now()
        );

        @Override
        public List<LeaveTypeDto> listLeaveTypes(Boolean isActiveOnly) {
            return List.of(sampleType);
        }

        @Override
        public LeaveTypeDto createLeaveType(LeaveTypeCreateRequest req) {
            return sampleType;
        }

        @Override
        public LeaveTypeDto updateLeaveType(UUID id, LeaveTypeUpdateRequest req) {
            return sampleType;
        }

        @Override
        public void deleteLeaveType(UUID id) {
        }

        @Override
        public int grantLeave(UUID createdBy, LeaveGrantRequest req) {
            return 3;
        }

        @Override
        public LeaveBalanceDto adjustLeave(UUID createdBy, LeaveAdjustmentRequest req) {
            return sampleBalance;
        }

        @Override
        public List<LeaveBalanceDto> getMyLeaveBalances(UUID employeeId) {
            return List.of(sampleBalance);
        }

        @Override
        public PagedData<LeaveBalanceDto> getAdminLeaveBalances(UUID employeeId, UUID leaveTypeId, int page, int size) {
            return PagedData.of(List.of(sampleBalance), 1, 50, 1);
        }

        @Override
        public PagedData<LeaveLedgerEntryDto> listLedgerEntries(UUID employeeId, UUID leaveTypeId, String entryType, int page, int size) {
            return PagedData.of(List.of(sampleEntry), 1, 50, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        currentUserId = UUID.randomUUID();
        stubTenantContext = new StubTenantContext();
        stubTenantContext.stubUserId = currentUserId;

        stubService = new StubLeaveLedgerService();
        resource = new LeaveAdminResource();
        Field sf = resource.getClass().getDeclaredField("leaveLedgerService");
        sf.setAccessible(true);
        sf.set(resource, stubService);

        Field tf = resource.getClass().getDeclaredField("tenantContext");
        tf.setAccessible(true);
        tf.set(resource, stubTenantContext);
    }

    @Test
    @DisplayName("Leave admin endpoints: types, grants, adjustments, balances, ledger")
    void testLeaveAdminEndpoints() {
        ApiResponse<ListData<LeaveTypeDto>> types = resource.listLeaveTypes(true);
        assertTrue(types.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_LEAVE_TYPE_LIST_SUCCESS, types.getCode());

        ApiResponse<LeaveTypeDto> createdType = resource.createLeaveType(new LeaveTypeCreateRequest(
                "SICK", "Nghỉ ốm", true, true, false, false, 0, null, null, true
        ));
        assertTrue(createdType.isSuccess());

        ApiResponse<Map<String, Object>> grant = resource.grantLeave(new LeaveGrantRequest(
                List.of(UUID.randomUUID()), UUID.randomUUID(), 10.0, null, "Cấp phép"
        ));
        assertTrue(grant.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_GRANT_SUCCESS, grant.getCode());

        ApiResponse<LeaveBalanceDto> adjust = resource.adjustLeave(new LeaveAdjustmentRequest(
                UUID.randomUUID(), UUID.randomUUID(), 1.0, "Thưởng"
        ));
        assertTrue(adjust.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_ADJUSTMENT_SUCCESS, adjust.getCode());

        ApiResponse<ListData<LeaveBalanceDto>> myBalances = resource.getMyLeaveBalances();
        assertTrue(myBalances.isSuccess());

        ApiResponse<PagedData<LeaveBalanceDto>> adminBalances = resource.getAdminLeaveBalances(null, null, 1, 50);
        assertTrue(adminBalances.isSuccess());

        ApiResponse<PagedData<LeaveLedgerEntryDto>> ledger = resource.listLeaveLedger(null, null, null, 1, 50);
        assertTrue(ledger.isSuccess());
    }
}

