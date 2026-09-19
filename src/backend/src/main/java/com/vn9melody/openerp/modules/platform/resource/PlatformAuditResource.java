package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.api.PagedData;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformPage;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.AuditChainVerification;
import com.vn9melody.openerp.modules.platform.service.AuditChainVerifier;
import com.vn9melody.openerp.modules.platform.service.AuditLogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1/platform/audit-logs")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformAuditResource {

    @Inject
    AuditLogService auditLogService;

    @Inject
    AuditChainVerifier auditChainVerifier;

    @GET
    public Response list(@QueryParam("page") Integer page, @QueryParam("size") Integer size,
                         @QueryParam("action") String action, @QueryParam("tenant_id") String tenantId,
                         @QueryParam("scope") String scope, @QueryParam("result") String result,
                         @QueryParam("actor_user_id") String actorUserId,
                         @QueryParam("resource_type") String resourceType,
                         @QueryParam("from_date") String fromDate, @QueryParam("to_date") String toDate,
                         @QueryParam("keyword") String keyword) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 200);

        AuditScope auditScope = null;
        if (scope != null && !scope.isBlank()) {
            try {
                auditScope = AuditScope.valueOf(scope.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid audit scope filter");
            }
        }
        PlatformPage<PlatformResponses.AuditLogItem> resultPage = auditLogService.listAuditLogs(
            auditScope,
            parseUuid(tenantId),
            action,
            result,
            parseUuid(actorUserId),
            resourceType,
            parseInstant(fromDate, false),
            parseInstant(toDate, true),
            keyword,
            safePage,
            safeSize);
        PagedData<PlatformResponses.AuditLogItem> data =
            PagedData.of(resultPage.items, safePage, safeSize, resultPage.totalItems);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_AUDIT_LOG_LIST_SUCCESS,
            "Audit logs retrieved successfully.", data)).build();
    }

    @GET
    @Path("/verify")
    public Response verify(@QueryParam("scope") String scope, @QueryParam("tenant_id") String tenantId,
                           @QueryParam("from_date") String fromDate, @QueryParam("to_date") String toDate) {
        AuditScope auditScope = scope == null || scope.isBlank()
            ? AuditScope.PLATFORM
            : AuditScope.valueOf(scope.trim().toUpperCase());
        AuditChainVerification verification = auditChainVerifier.verify(
            auditScope, parseUuid(tenantId), parseInstant(fromDate, false), parseInstant(toDate, true));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("chain_status", verification.status.name());
        data.put("checked_count", verification.checkedCount);
        data.put("broken_at_log_id", verification.brokenAtLogId != null ? verification.brokenAtLogId.toString() : null);
        data.put("broken_at_event_id", verification.brokenAtEventId != null
            ? verification.brokenAtEventId.toString() : null);
        data.put("reason", verification.reason);

        String code = verification.status == AuditChainVerification.Status.VERIFIED
            ? PlatformErrorCode.PLATFORM_AUDIT_CHAIN_VERIFIED
            : PlatformErrorCode.PLATFORM_AUDIT_CHAIN_TAMPERED;
        return Response.ok(ApiResponse.success(code, "Audit chain verification completed.", data)).build();
    }

    @GET
    @Path("/{id}")
    public Response detail(@PathParam("id") String id) {
        UUID parsed;
        try {
            parsed = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ApiException(404, PlatformErrorCode.PLATFORM_AUDIT_LOG_NOT_FOUND,
                "Audit log record not found");
        }
        PlatformResponses.AuditLogDetail detail = auditLogService.findAuditLogDetail(parsed);
        if (detail == null) {
            throw new ApiException(404, PlatformErrorCode.PLATFORM_AUDIT_LOG_NOT_FOUND,
                "Audit log record not found");
        }
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_AUDIT_LOG_DETAIL_SUCCESS,
            "Audit log detail retrieved successfully.", detail)).build();
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid UUID filter value");
        }
    }

    private Instant parseInstant(String value, boolean endOfDay) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        try {
            if (trimmed.length() == 10) {
                LocalDate date = LocalDate.parse(trimmed);
                return endOfDay
                    ? date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusNanos(1)
                    : date.atStartOfDay(ZoneOffset.UTC).toInstant();
            }
            return Instant.parse(trimmed);
        } catch (Exception e) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid date filter value");
        }
    }
}
