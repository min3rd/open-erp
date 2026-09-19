package com.vn9melody.openerp.modules.core.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiFieldError;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.api.PagedData;
import com.vn9melody.openerp.core.audit.AuditRecorder;
import com.vn9melody.openerp.core.context.DataScopeEngine;
import com.vn9melody.openerp.core.context.DataScopeTarget;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.core.dto.CreateSampleRecordRequest;
import com.vn9melody.openerp.modules.core.dto.SampleRecordExportResponse;
import com.vn9melody.openerp.modules.core.dto.SampleRecordResponse;
import com.vn9melody.openerp.modules.core.dto.UpdateSampleRecordRequest;
import com.vn9melody.openerp.modules.core.model.CoreSampleRecord;
import com.vn9melody.openerp.modules.core.repository.CoreSampleRecordRepository;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.Department;
import com.vn9melody.openerp.modules.organization.model.UserDepartmentMembership;
import com.vn9melody.openerp.modules.organization.repository.BranchRepository;
import com.vn9melody.openerp.modules.organization.repository.DepartmentRepository;
import com.vn9melody.openerp.modules.platform.service.TenantPluginAllowlistService;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business service of the reference entity {@code core_sample_records}
 * (TASK-283/284). Every read goes through the Data Permission Engine Hibernate
 * filter; mutations go through {@code canMutate} explicit checks.
 */
@ApplicationScoped
public class SampleRecordService {

    public static final String RESOURCE = "CORE_SAMPLE_RECORD";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_ARCHIVED = "ARCHIVED";

    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    CoreSampleRecordRepository repository;

    @Inject
    DataScopeEngine dataScopeEngine;

    @Inject
    BranchRepository branchRepository;

    @Inject
    DepartmentRepository departmentRepository;

    @Inject
    Instance<AuditRecorder> auditRecorders;

    @Inject
    TenantPluginAllowlistService pluginAllowlistService;

    @Transactional
    public SampleRecordResponse create(UserSecurityContext context, CreateSampleRecordRequest request) {
        // TASK-270 hook: the reference entity belongs to plugin "core"; every plugin entry
        // point must pass the tenant allowlist before touching tenant data.
        pluginAllowlistService.assertAllowed(context.tenantId(), TenantPluginAllowlistService.PLUGIN_CORE);
        String status = normalizeStatus(request.status);
        String title = requireTitle(request.title);
        BigDecimal amount = normalizeAmount(request.amount);

        DataScopeTarget target = dataScopeEngine.resolveCreateTarget(
            context, RESOURCE, request.branchId, request.departmentId);
        UUID branchId = target.branchId();
        UUID departmentId = target.departmentId();
        branchId = validateBranch(context.tenantId(), branchId);
        departmentId = validateDepartment(context.tenantId(), departmentId);
        if (departmentId != null && branchId == null) {
            Department department = departmentRepository.find("id = ?1", departmentId).firstResult();
            branchId = department != null ? department.branchId : null;
        }
        validateAssignee(context.tenantId(), request.assigneeId);

        CoreSampleRecord record = new CoreSampleRecord();
        record.tenantId = context.tenantId();
        record.branchId = branchId;
        record.departmentId = departmentId;
        record.createdBy = context.userId();
        record.assigneeId = request.assigneeId;
        record.title = title;
        record.amount = amount;
        record.status = status;
        record.createdAt = Instant.now();
        record.updatedAt = Instant.now();
        record.persist();

        recordAudit(context, record, "CORE_SAMPLE_RECORD_CREATE");
        return toResponse(record);
    }

    @Transactional
    public PagedData<SampleRecordResponse> list(UserSecurityContext context, int page, int size,
                                                String keyword, String status) {
        int safePage = Math.max(page, 0);
        int safeSize = size > 0 ? Math.min(size, MAX_PAGE_SIZE) : 20;

        StringBuilder query = new StringBuilder("tenantId = :tenantId");
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", context.tenantId());

        if (status != null && !status.isBlank()) {
            query.append(" and status = :status");
            params.put("status", status.trim().toUpperCase());
        } else {
            query.append(" and status <> :archived");
            params.put("archived", STATUS_ARCHIVED);
        }
        if (keyword != null && !keyword.isBlank()) {
            query.append(" and lower(title) like :keyword");
            params.put("keyword", "%" + keyword.trim().toLowerCase() + "%");
        }
        query.append(" order by createdAt desc, id desc");

        dataScopeEngine.applyReadFilter(context, RESOURCE);
        try {
            PanacheQuery<CoreSampleRecord> panacheQuery = repository.find(query.toString(), params);
            long total = panacheQuery.count();
            List<CoreSampleRecord> records = panacheQuery.page(Page.of(safePage, safeSize)).list();
            return PagedData.of(toResponses(records), safePage, safeSize, total);
        } finally {
            dataScopeEngine.clearFilters();
        }
    }

    @Transactional
    public SampleRecordResponse get(UserSecurityContext context, UUID id) {
        CoreSampleRecord record = findTenantRecord(context, id);
        dataScopeEngine.assertCanMutate(context, RESOURCE, DataOperation.READ, toTarget(record));
        return toResponse(record);
    }

    @Transactional
    public SampleRecordResponse update(UserSecurityContext context, UUID id, UpdateSampleRecordRequest request) {
        CoreSampleRecord record = findTenantRecord(context, id);
        dataScopeEngine.assertCanMutate(context, RESOURCE, DataOperation.UPDATE, toTarget(record));

        if (request.title != null) {
            record.title = requireTitle(request.title);
        }
        if (request.amount != null) {
            record.amount = normalizeAmount(request.amount);
        }
        if (request.status != null) {
            record.status = normalizeStatus(request.status);
        }
        if (request.branchId != null || request.departmentId != null) {
            UUID branchId = request.branchId != null ? validateBranch(context.tenantId(), request.branchId) : record.branchId;
            UUID departmentId = request.departmentId != null
                ? validateDepartment(context.tenantId(), request.departmentId)
                : record.departmentId;
            if (departmentId != null && branchId == null) {
                Department department = departmentRepository.find("id = ?1", departmentId).firstResult();
                branchId = department != null ? department.branchId : null;
            }
            DataScopeTarget requested = new DataScopeTarget(branchId, departmentId, context.userId(), context.userId());
            if (!dataScopeEngine.canMutate(context, RESOURCE, DataOperation.UPDATE, requested)) {
                throw dataScopeEngine.deniedDataScope(RESOURCE, DataOperation.UPDATE);
            }
            record.branchId = branchId;
            record.departmentId = departmentId;
        }
        if (request.assigneeId != null) {
            validateAssignee(context.tenantId(), request.assigneeId);
            record.assigneeId = request.assigneeId;
        }
        record.updatedAt = Instant.now();
        record.persist();

        recordAudit(context, record, "CORE_SAMPLE_RECORD_UPDATE");
        return toResponse(record);
    }

    /** Soft delete: the row is archived, never physically removed. */
    @Transactional
    public SampleRecordResponse delete(UserSecurityContext context, UUID id) {
        CoreSampleRecord record = findTenantRecord(context, id);
        dataScopeEngine.assertCanMutate(context, RESOURCE, DataOperation.DELETE, toTarget(record));
        record.status = STATUS_ARCHIVED;
        record.updatedAt = Instant.now();
        record.persist();

        recordAudit(context, record, "CORE_SAMPLE_RECORD_DELETE");
        return toResponse(record);
    }

    @Transactional
    public SampleRecordResponse share(UserSecurityContext context, UUID id, UUID assigneeId) {
        CoreSampleRecord record = findTenantRecord(context, id);
        dataScopeEngine.assertCanMutate(context, RESOURCE, DataOperation.SHARE, toTarget(record));
        validateAssignee(context.tenantId(), assigneeId);
        record.assigneeId = assigneeId;
        record.updatedAt = Instant.now();
        record.persist();

        recordAudit(context, record, "CORE_SAMPLE_RECORD_SHARE");
        return toResponse(record);
    }

    /** Exports the rows inside the EXPORT scope (TASK-284). */
    @Transactional
    public ExportPayload export(UserSecurityContext context, String format) {
        dataScopeEngine.assertExportAllowed(context, RESOURCE);
        boolean json = "json".equalsIgnoreCase(format != null ? format.trim() : "");

        dataScopeEngine.applyScopeFilter(context, RESOURCE, DataOperation.EXPORT);
        List<CoreSampleRecord> records;
        try {
            records = repository.list("tenantId = ?1 and status <> ?2 order by createdAt desc, id desc",
                context.tenantId(), STATUS_ARCHIVED);
        } finally {
            dataScopeEngine.clearFilters();
        }

        String content = json ? toJson(records) : toCsv(records);
        String contentType = json ? "application/json" : "text/csv";
        String extension = json ? "json" : "csv";
        String filename = "core-sample-records-" + context.tenantId() + "." + extension;
        String dataUrl = "data:" + contentType + ";base64,"
            + Base64.getEncoder().encodeToString(content.getBytes(StandardCharsets.UTF_8));

        recordAudit(context, null, "CORE_SAMPLE_RECORD_EXPORT");
        return new ExportPayload(content, contentType, filename,
            new SampleRecordExportResponse(dataUrl, dataUrl, extension.toUpperCase(), records.size()));
    }

    public record ExportPayload(String content, String contentType, String filename,
                                SampleRecordExportResponse metadata) {
    }

    private CoreSampleRecord findTenantRecord(UserSecurityContext context, UUID id) {
        if (id == null) {
            throw new ApiException(404, ErrorCode.NOT_FOUND, "Sample record not found");
        }
        CoreSampleRecord record = repository.find("id = ?1 and tenantId = ?2", id, context.tenantId()).firstResult();
        if (record == null) {
            throw new ApiException(404, ErrorCode.NOT_FOUND, "Sample record not found");
        }
        return record;
    }

    private DataScopeTarget toTarget(CoreSampleRecord record) {
        return new DataScopeTarget(record.branchId, record.departmentId, record.createdBy, record.assigneeId);
    }

    private UUID validateBranch(UUID tenantId, UUID branchId) {
        if (branchId == null) {
            return null;
        }
        Branch branch = branchRepository.find("id = ?1", branchId).firstResult();
        if (branch == null || !tenantId.equals(branch.tenantId)) {
            throw new ApiException(403, ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE,
                "Branch is outside the allowed data scope", scopeParams());
        }
        return branchId;
    }

    private UUID validateDepartment(UUID tenantId, UUID departmentId) {
        if (departmentId == null) {
            return null;
        }
                Department department = departmentRepository.find("id = ?1", departmentId).firstResult();
        if (department == null || !tenantId.equals(department.tenantId)) {
            throw new ApiException(403, ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE,
                "Department is outside the allowed data scope", scopeParams());
        }
        return departmentId;
    }

    private void validateAssignee(UUID tenantId, UUID assigneeId) {
        if (assigneeId == null) {
            return;
        }
        boolean member = UserTenant.findByUserAndTenant(assigneeId, tenantId) != null
            || UserDepartmentMembership.count("userId = ?1 and tenantId = ?2", assigneeId, tenantId) > 0;
        if (!member) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Assignee does not belong to the tenant",
                Map.of(ResponseKey.FIELD.getKey(), ResponseKey.ASSIGNEE_ID.getKey()),
                List.of(new ApiFieldError(ResponseKey.ASSIGNEE_ID.getKey(), ErrorCode.VALIDATION_INVALID, Map.of())));
        }
    }

    private Map<String, Object> scopeParams() {
        Map<String, Object> params = new HashMap<>();
        params.put(ResponseKey.RESOURCE.getKey(), RESOURCE);
        return params;
    }

    private String requireTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "Title is required",
                Map.of(ResponseKey.FIELD.getKey(), ResponseKey.TITLE.getKey()),
                List.of(new ApiFieldError(ResponseKey.TITLE.getKey(), ErrorCode.VALIDATION_REQUIRED, Map.of())));
        }
        return title.trim();
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        if (amount.signum() < 0) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Amount must not be negative");
        }
        return amount;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return STATUS_ACTIVE;
        }
        String normalized = status.trim().toUpperCase();
        if (!STATUS_ACTIVE.equals(normalized) && !STATUS_ARCHIVED.equals(normalized)) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid sample record status");
        }
        return normalized;
    }

    private List<SampleRecordResponse> toResponses(List<CoreSampleRecord> records) {
        if (records == null || records.isEmpty()) {
            return List.of();
        }
        Set<UUID> branchIds = records.stream().map(r -> r.branchId).filter(java.util.Objects::nonNull)
            .collect(Collectors.toSet());
        Set<UUID> departmentIds = records.stream().map(r -> r.departmentId).filter(java.util.Objects::nonNull)
            .collect(Collectors.toSet());
        Set<UUID> userIds = new HashSet<>();
        records.forEach(r -> {
            if (r.assigneeId != null) {
                userIds.add(r.assigneeId);
            }
            if (r.createdBy != null) {
                userIds.add(r.createdBy);
            }
        });

        Map<UUID, String> branchNames = names(branchIds, id -> {
            Branch branch = branchRepository.find("id = ?1", id).firstResult();
            return branch != null ? branch.name : null;
        });
        Map<UUID, String> departmentNames = names(departmentIds, id -> {
            Department department = departmentRepository.find("id = ?1", id).firstResult();
            return department != null ? department.name : null;
        });
        Map<UUID, String> userNames = names(userIds, id -> {
            UserProfile profile = UserProfile.findByUserId(id);
            return profile != null ? profile.fullName : null;
        });

        List<SampleRecordResponse> responses = new ArrayList<>(records.size());
        for (CoreSampleRecord record : records) {
            responses.add(SampleRecordResponse.from(record,
                record.branchId != null ? branchNames.get(record.branchId) : null,
                record.departmentId != null ? departmentNames.get(record.departmentId) : null,
                record.assigneeId != null ? userNames.get(record.assigneeId) : null));
        }
        return responses;
    }

    private SampleRecordResponse toResponse(CoreSampleRecord record) {
        List<SampleRecordResponse> responses = toResponses(List.of(record));
        return responses.get(0);
    }

    private Map<UUID, String> names(Collection<UUID> ids, java.util.function.Function<UUID, String> resolver) {
        Map<UUID, String> result = new LinkedHashMap<>();
        for (UUID id : ids) {
            result.put(id, resolver.apply(id));
        }
        return result;
    }

    private String toCsv(List<CoreSampleRecord> records) {
        StringBuilder builder = new StringBuilder("id,title,amount,status,branch_id,department_id,created_by,assignee_id,created_at\n");
        for (CoreSampleRecord record : records) {
            builder.append(csv(record.id)).append(',')
                .append(csv(record.title)).append(',')
                .append(record.amount != null ? record.amount.toPlainString() : "0").append(',')
                .append(csv(record.status)).append(',')
                .append(csv(record.branchId)).append(',')
                .append(csv(record.departmentId)).append(',')
                .append(csv(record.createdBy)).append(',')
                .append(csv(record.assigneeId)).append(',')
                .append(csv(record.createdAt)).append('\n');
        }
        return builder.toString();
    }

    private String toJson(List<CoreSampleRecord> records) {
        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < records.size(); i++) {
            CoreSampleRecord record = records.get(i);
            if (i > 0) {
                builder.append(',');
            }
            builder.append('{')
                .append("\"id\":\"").append(record.id).append("\",")
                .append("\"title\":\"").append(json(record.title)).append("\",")
                .append("\"amount\":").append(record.amount != null ? record.amount.toPlainString() : "0").append(',')
                .append("\"status\":\"").append(json(record.status)).append("\",")
                .append("\"branch_id\":").append(record.branchId != null ? "\"" + record.branchId + "\"" : "null").append(',')
                .append("\"department_id\":").append(record.departmentId != null ? "\"" + record.departmentId + "\"" : "null").append(',')
                .append("\"created_by\":\"").append(record.createdBy).append("\",")
                .append("\"assignee_id\":").append(record.assigneeId != null ? "\"" + record.assigneeId + "\"" : "null").append(',')
                .append("\"created_at\":\"").append(record.createdAt).append("\"")
                .append('}');
        }
        return builder.append(']').toString();
    }

    private String csv(Object value) {
        if (value == null) {
            return "";
        }
        String text = value.toString();
        if (text.contains(",") || text.contains("\"") || text.contains("\n")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    private String json(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void recordAudit(UserSecurityContext context, CoreSampleRecord record, String action) {
        Map<String, Object> details = new HashMap<>();
        if (record != null) {
            details.put(ResponseKey.ID.getKey(), record.id != null ? record.id.toString() : null);
            details.put(ResponseKey.TITLE.getKey(), record.title);
        }
        com.vn9melody.openerp.core.enums.AuditResult result = com.vn9melody.openerp.core.enums.AuditResult.SUCCESS;
        AuditRecorder.AuditEvent event = new AuditRecorder.AuditEvent(
            context != null ? context.tenantId() : null,
            context != null ? context.userId() : null,
            action, RESOURCE, record != null ? record.id : null,
            result, details, null);
        for (AuditRecorder recorder : auditRecorders) {
            recorder.record(event);
        }
    }
}
