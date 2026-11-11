package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.ApprovalMode;
import com.vn9melody.openerp.plugins.attendance.model.MappingStatus;
import com.vn9melody.openerp.plugins.attendance.model.RequestStatus;
import com.vn9melody.openerp.plugins.attendance.service.RequestService;
import com.vn9melody.openerp.plugins.attendance.service.RequestTypeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class RequestResourceTest {

    private RequestResource requestResource;
    private RequestTypeAdminResource requestTypeResource;
    private StubRequestService stubRequestService;
    private StubRequestTypeService stubRequestTypeService;
    private StubTenantContext stubTenantContext;
    private UUID currentUserId;

    static class StubTenantContext extends TenantContext {
        UUID stubUserId;

        @Override
        public UUID userId() {
            return stubUserId;
        }
    }

    static class StubRequestService extends RequestService {
        RequestDto sampleDto;

        @Override
        public RequestDto submitRequest(UUID subjectEmployeeId, UUID currentUserId, RequestSubmitRequest req) {
            return sampleDto;
        }

        @Override
        public RequestDto getRequest(UUID id) {
            return sampleDto;
        }

        @Override
        public PagedData<RequestDto> getMyRequests(UUID employeeId, String status, String typeCode, int page, int size) {
            return PagedData.of(List.of(sampleDto), 1, 20, 1);
        }

        @Override
        public PagedData<RequestDto> getInboxRequests(UUID approverEmployeeId, int page, int size) {
            return PagedData.of(List.of(sampleDto), 1, 20, 1);
        }

        @Override
        public RequestDto fallbackAction(UUID requestId, UUID currentUserId, FallbackActionRequest req) {
            return sampleDto;
        }
    }

    static class StubRequestTypeService extends RequestTypeService {
        RequestTypeDto sampleType = new RequestTypeDto(
                UUID.randomUUID(), "LEAVE", "Nghỉ phép", true, true,
                Map.of(), "wf-leave", Map.of(), 30, 1, Instant.now(), Instant.now()
        );

        @Override
        public List<RequestTypeDto> listRequestTypes(boolean activeOnly) {
            return List.of(sampleType);
        }

        @Override
        public RequestTypeDto createCustomType(RequestTypeCreateRequest req) {
            return sampleType;
        }

        @Override
        public RequestTypeDto updateRequestType(UUID id, RequestTypeUpdateRequest req) {
            return sampleType;
        }

        @Override
        public void deleteRequestType(UUID id) {
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        currentUserId = UUID.randomUUID();
        stubTenantContext = new StubTenantContext();
        stubTenantContext.stubUserId = currentUserId;

        stubRequestService = new StubRequestService();
        stubRequestService.sampleDto = new RequestDto(
                UUID.randomUUID(), "REQ-01", UUID.randomUUID(), "LEAVE", "Nghỉ phép",
                currentUserId, "An", currentUserId, 1, Map.of(),
                RequestStatus.PENDING, null, ApprovalMode.INTERNAL_FALLBACK,
                null, null, Map.of(), MappingStatus.PENDING, null, Instant.now(), Instant.now()
        );

        stubRequestTypeService = new StubRequestTypeService();

        requestResource = new RequestResource();
        setField(requestResource, "requestService", stubRequestService);
        setField(requestResource, "tenantContext", stubTenantContext);

        requestTypeResource = new RequestTypeAdminResource();
        setField(requestTypeResource, "requestTypeService", stubRequestTypeService);
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    @Test
    @DisplayName("Request endpoints: submit, my-requests, inbox, get, fallback-action")
    void testRequestEndpoints() {
        ApiResponse<RequestDto> submit = requestResource.submitRequest(new RequestSubmitRequest(
                "LEAVE", Map.of(), Map.of()
        ));
        assertTrue(submit.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_REQUEST_CREATED, submit.getCode());

        ApiResponse<PagedData<RequestDto>> my = requestResource.getMyRequests(null, null, 1, 20);
        assertTrue(my.isSuccess());
        assertEquals(1, my.getData().getItems().size());

        ApiResponse<PagedData<RequestDto>> inbox = requestResource.getInbox(1, 20);
        assertTrue(inbox.isSuccess());

        ApiResponse<RequestDto> get = requestResource.getRequest(submit.getData().id());
        assertTrue(get.isSuccess());

        ApiResponse<RequestDto> act = requestResource.fallbackAction(submit.getData().id(),
                new FallbackActionRequest(RequestStatus.APPROVED, "OK"));
        assertTrue(act.isSuccess());
    }

    @Test
    @DisplayName("Request type endpoints: list, create, update, delete")
    void testRequestTypeEndpoints() {
        ApiResponse<ListData<RequestTypeDto>> list = requestTypeResource.listRequestTypes(true);
        assertTrue(list.isSuccess());
        assertEquals(1, list.getData().getItems().size());

        ApiResponse<RequestTypeDto> create = requestTypeResource.createCustomType(new RequestTypeCreateRequest(
                "X_SPECIAL", "Đặc biệt", null, null, 10, 10
        ));
        assertTrue(create.isSuccess());

        ApiResponse<Map<String, Object>> del = requestTypeResource.deleteRequestType(create.getData().id());
        assertTrue(del.isSuccess());
    }
}

