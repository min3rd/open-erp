package com.vn9melody.openerp.plugins.organization.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.organization.api.OrganizationErrorCode;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BootstrapResult;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchAccessRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchAccessResponse;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchResponse;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.DepartmentRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.DepartmentResponse;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.MembershipRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.MembershipResponse;
import com.vn9melody.openerp.plugins.organization.model.OrgBranch;
import com.vn9melody.openerp.plugins.organization.model.OrgBranchAccess;
import com.vn9melody.openerp.plugins.organization.model.OrgDepartment;
import com.vn9melody.openerp.plugins.organization.model.OrgMembership;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class OrganizationService {

    private static final List<String[]> DEFAULT_DEPARTMENTS = List.of(
        new String[]{"GENERAL", "Phòng ban chung"},
        new String[]{"HR", "Nhân sự"},
        new String[]{"FINANCE", "Tài chính - Kế toán"},
        new String[]{"SALES", "Kinh doanh"},
        new String[]{"MARKETING", "Marketing"},
        new String[]{"IT", "Công nghệ thông tin"},
        new String[]{"OPERATIONS", "Vận hành"},
        new String[]{"CUSTOMER_SERVICE", "Chăm sóc khách hàng"}
    );

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    @Inject
    ObjectMapper objectMapper;

    public List<BranchResponse> listBranches() {
        return client.query("branch.list", Map.of()).rows().stream()
            .map(OrgBranch::from)
            .map(BranchResponse::from)
            .toList();
    }

    public List<DepartmentResponse> listDepartments() {
        return client.query("department.list", Map.of()).rows().stream()
            .map(OrgDepartment::from)
            .map(DepartmentResponse::from)
            .toList();
    }

    public List<MembershipResponse> listMemberships(UUID userId) {
        return client.query("membership.list", Map.of("user_id", userId)).rows().stream()
            .map(OrgMembership::from)
            .map(MembershipResponse::from)
            .toList();
    }

    public List<MembershipResponse> listAllMemberships() {
        return client.query("membership.list_all", Map.of()).rows().stream()
            .map(OrgMembership::from)
            .map(MembershipResponse::from)
            .toList();
    }

    public List<BranchAccessResponse> listBranchAccess(UUID userId) {
        return client.query("branch_access.list", Map.of("user_id", userId)).rows().stream()
            .map(OrgBranchAccess::from)
            .map(BranchAccessResponse::from)
            .toList();
    }

    public List<BranchAccessResponse> listAllBranchAccess() {
        return client.query("branch_access.list_all", Map.of()).rows().stream()
            .map(OrgBranchAccess::from)
            .map(BranchAccessResponse::from)
            .toList();
    }

    public BranchResponse createBranch(BranchRequest request) {
        requireBody(request);
        String code = OrganizationValidation.code(request.code(), "code");
        String name = OrganizationValidation.name(request.name(), "name");
        if (branchByCode(code, null) != null) {
            throw new ApiException(409, OrganizationErrorCode.BRANCH_CODE_EXISTS,
                "Branch code already exists", Map.of("code", code));
        }
        Map<String, Object> params = new HashMap<>();
        params.put("code", code);
        params.put("name", name);
        params.put("phone", request.phone());
        params.put("address", request.address());
        params.put("is_default", Boolean.TRUE.equals(request.isDefault()));
        params.put("status", OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("branch.insert", params).rows());
        emit("BRANCH_UPSERTED", row.get("id"), Map.of("code", code, "name", name));
        return BranchResponse.from(OrgBranch.from(row));
    }

    public BranchResponse updateBranch(UUID id, BranchRequest request) {
        requireBody(request);
        OrgBranch existing = requireBranch(id);
        String code = OrganizationValidation.code(request.code(), "code");
        String name = OrganizationValidation.name(request.name(), "name");
        Map<String, Object> duplicate = branchByCode(code, id);
        if (duplicate != null) {
            throw new ApiException(409, OrganizationErrorCode.BRANCH_CODE_EXISTS,
                "Branch code already exists", Map.of("code", code));
        }
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("code", code);
        params.put("name", name);
        params.put("phone", request.phone());
        params.put("address", request.address());
        params.put("is_default", request.isDefault() == null ? existing.isDefault : request.isDefault());
        params.put("status", request.status() == null ? existing.status : OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("branch.update", params).rows());
        emit("BRANCH_UPSERTED", id, Map.of("code", code, "name", name));
        return BranchResponse.from(OrgBranch.from(row));
    }

    public BranchResponse archiveBranch(UUID id, BranchRequest request) {
        OrgBranch existing = requireBranch(id);
        boolean hasActiveDepartments = client.query("department.list", Map.of()).rows().stream()
            .map(OrgDepartment::from)
            .anyMatch(d -> id.equals(d.branchId) && "ACTIVE".equals(d.status));
        if (hasActiveDepartments) {
            throw new ApiException(409, OrganizationErrorCode.BRANCH_IN_USE,
                "Branch still has active departments", Map.of("branch_id", id.toString()));
        }
        BranchRequest archive = new BranchRequest(
            existing.code, existing.name, existing.phone, existing.address,
            existing.isDefault, "INACTIVE");
        return updateBranch(id, archive);
    }

    public DepartmentResponse createDepartment(DepartmentRequest request) {
        requireBody(request);
        String code = OrganizationValidation.code(request.code(), "code");
        String name = OrganizationValidation.name(request.name(), "name");
        OrgBranch branch = requireBranch(request.branchId());
        if (request.parentId() != null) {
            OrgDepartment parent = requireDepartment(request.parentId());
            if (!branch.id.equals(parent.branchId)) {
                throw new ApiException(400, OrganizationErrorCode.DEPARTMENT_BRANCH_MISMATCH,
                    "Parent department belongs to another branch", Map.of());
            }
        }
        if (departmentByCode(code, null) != null) {
            throw new ApiException(409, OrganizationErrorCode.DEPARTMENT_CODE_EXISTS,
                "Department code already exists", Map.of("code", code));
        }
        Map<String, Object> params = new HashMap<>();
        params.put("branch_id", branch.id);
        params.put("parent_id", request.parentId());
        params.put("code", code);
        params.put("name", name);
        params.put("manager_user_id", request.managerUserId());
        params.put("status", OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("department.insert", params).rows());
        emit("DEPARTMENT_TREE_CHANGED", row.get("id"), Map.of("code", code));
        return DepartmentResponse.from(OrgDepartment.from(row));
    }

    public DepartmentResponse updateDepartment(UUID id, DepartmentRequest request) {
        requireBody(request);
        OrgDepartment existing = requireDepartment(id);
        String code = OrganizationValidation.code(request.code(), "code");
        String name = OrganizationValidation.name(request.name(), "name");
        OrgBranch branch = requireBranch(request.branchId());
        if (request.parentId() != null) {
            if (id.equals(request.parentId())) {
                throw new ApiException(400, OrganizationErrorCode.DEPARTMENT_CYCLE,
                    "Department cannot be its own parent", Map.of());
            }
            OrgDepartment parent = requireDepartment(request.parentId());
            if (!branch.id.equals(parent.branchId)) {
                throw new ApiException(400, OrganizationErrorCode.DEPARTMENT_BRANCH_MISMATCH,
                    "Parent department belongs to another branch", Map.of());
            }
            ensureNoCycle(id, request.parentId());
        }
        if (departmentByCode(code, id) != null) {
            throw new ApiException(409, OrganizationErrorCode.DEPARTMENT_CODE_EXISTS,
                "Department code already exists", Map.of("code", code));
        }
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("branch_id", branch.id);
        params.put("parent_id", request.parentId());
        params.put("code", code);
        params.put("name", name);
        params.put("manager_user_id", request.managerUserId());
        params.put("status", request.status() == null ? existing.status : OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("department.update", params).rows());
        emit("DEPARTMENT_TREE_CHANGED", id, Map.of("code", code));
        return DepartmentResponse.from(OrgDepartment.from(row));
    }

    public DepartmentResponse archiveDepartment(UUID id, DepartmentRequest request) {
        OrgDepartment existing = requireDepartment(id);
        boolean hasChildren = client.query("department.list", Map.of()).rows().stream()
            .map(OrgDepartment::from)
            .anyMatch(d -> id.equals(d.parentId) && "ACTIVE".equals(d.status));
        if (hasChildren) {
            throw new ApiException(409, OrganizationErrorCode.DEPARTMENT_IN_USE,
                "Department still has child departments", Map.of("department_id", id.toString()));
        }
        long activeMembers = client.query("membership.list_by_department",
                Map.of("department_id", id)).rows().stream()
            .map(OrgMembership::from)
            .filter(m -> "ACTIVE".equals(m.status))
            .count();
        if (activeMembers > 0) {
            throw new ApiException(409, OrganizationErrorCode.DEPARTMENT_NOT_FOUND,
                "Department still has active members", Map.of("department_id", id.toString()));
        }
        DepartmentRequest archive = new DepartmentRequest(
            existing.branchId, existing.parentId, existing.code, existing.name,
            existing.managerUserId, "INACTIVE");
        return updateDepartment(id, archive);
    }

    public MembershipResponse createMembership(MembershipRequest request) {
        requireBody(request);
        OrgBranch branch = requireBranch(request.branchId());
        OrgDepartment department = requireDepartment(request.departmentId());
        if (!branch.id.equals(department.branchId)) {
            throw new ApiException(400, OrganizationErrorCode.DEPARTMENT_BRANCH_MISMATCH,
                "Department does not belong to branch", Map.of());
        }
        LocalDate from = request.validFrom() == null ? LocalDate.now() : request.validFrom();
        OrganizationValidation.dateRange(from, request.validTo());
        if (Boolean.TRUE.equals(request.isPrimary())) {
            ensurePrimaryAvailable(request.userId(), null);
        }
        Map<String, Object> params = new HashMap<>();
        params.put("user_id", request.userId());
        params.put("branch_id", branch.id);
        params.put("department_id", department.id);
        params.put("direct_manager_user_id", request.directManagerUserId());
        params.put("is_primary", Boolean.TRUE.equals(request.isPrimary()));
        params.put("joined_at", Instant.now());
        params.put("valid_from", from);
        params.put("valid_to", request.validTo());
        params.put("status", OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("membership.insert", params).rows());
        emit("MEMBERSHIP_UPSERTED", row.get("id"), Map.of("user_id", String.valueOf(request.userId())));
        return MembershipResponse.from(OrgMembership.from(row));
    }

    public MembershipResponse updateMembership(UUID id, MembershipRequest request) {
        requireBody(request);
        OrgMembership existing = requireMembership(id);
        if (request.userId() != null && !request.userId().equals(existing.userId)) {
            throw new ApiException(400, "VALIDATION_IMMUTABLE_FIELD",
                "user_id cannot be changed", Map.of("field", "user_id"));
        }
        OrgBranch branch = requireBranch(request.branchId());
        OrgDepartment department = requireDepartment(request.departmentId());
        if (!branch.id.equals(department.branchId)) {
            throw new ApiException(400, OrganizationErrorCode.DEPARTMENT_BRANCH_MISMATCH,
                "Department does not belong to branch", Map.of());
        }
        LocalDate from = request.validFrom() == null ? existing.validFrom : request.validFrom();
        OrganizationValidation.dateRange(from, request.validTo());
        if (Boolean.TRUE.equals(request.isPrimary())) {
            ensurePrimaryAvailable(request.userId(), id);
        }
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("branch_id", branch.id);
        params.put("department_id", department.id);
        params.put("direct_manager_user_id", request.directManagerUserId());
        params.put("is_primary", request.isPrimary() == null ? existing.isPrimary : request.isPrimary());
        params.put("valid_from", from);
        params.put("valid_to", request.validTo());
        params.put("status", request.status() == null ? existing.status : OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("membership.update", params).rows());
        emit("MEMBERSHIP_UPSERTED", id, Map.of("user_id", String.valueOf(existing.userId)));
        return MembershipResponse.from(OrgMembership.from(row));
    }

    public void deleteMembership(UUID id) {
        OrgMembership existing = requireMembership(id);
        client.write("membership.delete", Map.of("id", id));
        emit("MEMBERSHIP_REMOVED", id, Map.of("user_id", String.valueOf(existing.userId)));
    }

    public BranchAccessResponse createBranchAccess(BranchAccessRequest request) {
        requireBody(request);
        OrgBranch branch = requireBranch(request.branchId());
        LocalDate from = request.validFrom() == null ? LocalDate.now() : request.validFrom();
        OrganizationValidation.dateRange(from, request.validTo());
        if (Boolean.TRUE.equals(request.isPrimary())) {
            ensurePrimaryBranchAccessAvailable(request.userId(), null);
        }
        Map<String, Object> params = new HashMap<>();
        params.put("user_id", request.userId());
        params.put("branch_id", branch.id);
        params.put("is_primary", Boolean.TRUE.equals(request.isPrimary()));
        params.put("can_manage", Boolean.TRUE.equals(request.canManage()));
        params.put("assigned_at", Instant.now());
        params.put("valid_from", from);
        params.put("valid_to", request.validTo());
        params.put("status", OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("branch_access.insert", params).rows());
        emit("BRANCH_ACCESS_UPSERTED", row.get("id"), Map.of("user_id", String.valueOf(request.userId())));
        return BranchAccessResponse.from(OrgBranchAccess.from(row));
    }

    public BranchAccessResponse updateBranchAccess(UUID id, BranchAccessRequest request) {
        requireBody(request);
        OrgBranch branch = requireBranch(request.branchId());
        LocalDate from = request.validFrom() == null ? LocalDate.now() : request.validFrom();
        OrganizationValidation.dateRange(from, request.validTo());
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("branch_id", branch.id);
        params.put("is_primary", Boolean.TRUE.equals(request.isPrimary()));
        params.put("can_manage", Boolean.TRUE.equals(request.canManage()));
        params.put("valid_from", from);
        params.put("valid_to", request.validTo());
        params.put("status", OrganizationValidation.status(request.status()));
        Map<String, Object> row = first(client.write("branch_access.update", params).rows());
        emit("BRANCH_ACCESS_UPSERTED", id, Map.of("user_id", String.valueOf(request.userId())));
        return BranchAccessResponse.from(OrgBranchAccess.from(row));
    }

    public void deleteBranchAccess(UUID id) {
        client.write("branch_access.delete", Map.of("id", id));
        emit("BRANCH_ACCESS_REMOVED", id, Map.of());
    }

    /**
     * Idempotent tenant bootstrap: HQ branch + GENERAL department + owner membership.
     * Core onboarding calls this after tenant creation.
     */
    public BootstrapResult bootstrap() {
        UUID userId = context.userId();
        if (context.tenantId() == null) {
            throw new ApiException(401, OrganizationErrorCode.BOOTSTRAP_TENANT_REQUIRED,
                "Tenant context is required");
        }

        Map<String, Object> branchRow = first(client.query("branch.list", Map.of()).rows());
        boolean created = branchRow == null;
        if (branchRow == null) {
            Map<String, Object> params = new HashMap<>();
            params.put("code", "HQ");
            params.put("name", "Trụ sở chính");
            params.put("phone", null);
            params.put("address", null);
            params.put("is_default", true);
            params.put("status", "ACTIVE");
            branchRow = first(client.write("branch.insert", params).rows());
        }
        String branchId = text(branchRow.get("id"));

        List<Map<String, Object>> departmentRows = client.query("department.list", Map.of()).rows();
        boolean hasGeneral = departmentRows.stream()
            .anyMatch(row -> "GENERAL".equals(text(row.get("code"))));
        Map<String, Object> departmentRow = departmentRows.stream()
            .filter(row -> "GENERAL".equals(text(row.get("code"))))
            .findFirst()
            .orElse(null);
        if (!hasGeneral) {
            departmentRow = insertDefaultDepartment(branchId, "GENERAL", "Phòng ban chung");
            created = true;
        }
        for (String[] seed : DEFAULT_DEPARTMENTS) {
            if ("GENERAL".equals(seed[0])) {
                continue;
            }
            boolean exists = departmentRows.stream()
                .anyMatch(row -> seed[0].equals(text(row.get("code"))));
            if (!exists) {
                insertDefaultDepartment(branchId, seed[0], seed[1]);
                created = true;
            }
        }
        String departmentId = text(departmentRow.get("id"));

        String membershipId = null;
        if (userId != null) {
            List<Map<String, Object>> rows = client.query("membership.list",
                Map.of("user_id", userId)).rows();
            Map<String, Object> membership = first(rows);
            if (membership == null) {
                Map<String, Object> params = new HashMap<>();
                params.put("user_id", userId);
                params.put("branch_id", UUID.fromString(branchId));
                params.put("department_id", UUID.fromString(departmentId));
                params.put("direct_manager_user_id", null);
                params.put("is_primary", true);
                params.put("joined_at", Instant.now());
                params.put("valid_from", LocalDate.now());
                params.put("valid_to", null);
                params.put("status", "ACTIVE");
                membership = first(client.write("membership.insert", params).rows());
                created = true;
            }
            membershipId = text(membership.get("id"));
        }

        return new BootstrapResult(branchId, departmentId, membershipId, created);
    }

    private Map<String, Object> insertDefaultDepartment(String branchId, String code, String name) {
        Map<String, Object> params = new HashMap<>();
        params.put("branch_id", UUID.fromString(branchId));
        params.put("parent_id", null);
        params.put("code", code);
        params.put("name", name);
        params.put("manager_user_id", null);
        params.put("status", "ACTIVE");
        return first(client.write("department.insert", params).rows());
    }

    private OrgBranch requireBranch(UUID id) {
        if (id == null) {
            throw new ApiException(400, OrganizationErrorCode.BRANCH_REQUIRED, "branch_id is required");
        }
        List<Map<String, Object>> rows = client.query("branch.get", Map.of("id", id)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, OrganizationErrorCode.BRANCH_NOT_FOUND,
                "Branch not found", Map.of("branch_id", id.toString()));
        }
        return OrgBranch.from(rows.get(0));
    }

    private OrgDepartment requireDepartment(UUID id) {
        if (id == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "department_id is required");
        }
        List<Map<String, Object>> rows = client.query("department.get", Map.of("id", id)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, OrganizationErrorCode.DEPARTMENT_NOT_FOUND,
                "Department not found", Map.of("department_id", id.toString()));
        }
        return OrgDepartment.from(rows.get(0));
    }

    private OrgMembership requireMembership(UUID id) {
        List<Map<String, Object>> rows = client.query("membership.get", Map.of("id", id)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, OrganizationErrorCode.MEMBERSHIP_NOT_FOUND,
                "Membership not found", Map.of("membership_id", id.toString()));
        }
        return OrgMembership.from(rows.get(0));
    }

    private Map<String, Object> branchByCode(String code, UUID excludeId) {
        return client.query("branch.list", Map.of()).rows().stream()
            .filter(row -> code.equalsIgnoreCase(text(row.get("code"))))
            .filter(row -> excludeId == null || !excludeId.toString().equals(text(row.get("id"))))
            .findFirst().orElse(null);
    }

    private Map<String, Object> departmentByCode(String code, UUID excludeId) {
        return client.query("department.list", Map.of()).rows().stream()
            .filter(row -> code.equalsIgnoreCase(text(row.get("code"))))
            .filter(row -> excludeId == null || !excludeId.toString().equals(text(row.get("id"))))
            .findFirst().orElse(null);
    }

    private void ensureNoCycle(UUID id, UUID parentId) {
        Map<UUID, UUID> parentById = new HashMap<>();
        for (Map<String, Object> row : client.query("department.list", Map.of()).rows()) {
            OrgDepartment item = OrgDepartment.from(row);
            parentById.put(item.id, item.parentId);
        }
        Set<UUID> seen = new HashSet<>();
        UUID cursor = parentId;
        while (cursor != null) {
            if (!seen.add(cursor)) {
                throw new ApiException(400, OrganizationErrorCode.DEPARTMENT_CYCLE,
                    "Department hierarchy cycle detected", Map.of());
            }
            if (cursor.equals(id)) {
                throw new ApiException(400, OrganizationErrorCode.DEPARTMENT_CYCLE,
                    "Department hierarchy cycle detected", Map.of());
            }
            cursor = parentById.get(cursor);
        }
    }

    private void ensurePrimaryAvailable(UUID userId, UUID excludeId) {
        if (userId == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "user_id is required");
        }
        boolean exists = client.query("membership.list", Map.of("user_id", userId)).rows().stream()
            .map(OrgMembership::from)
            .anyMatch(m -> Boolean.TRUE.equals(m.isPrimary)
                && "ACTIVE".equals(m.status)
                && (excludeId == null || !excludeId.equals(m.id)));
        if (exists) {
            throw new ApiException(409, OrganizationErrorCode.MEMBERSHIP_PRIMARY_EXISTS,
                "User already has a primary membership", Map.of("user_id", userId.toString()));
        }
    }

    private void ensurePrimaryBranchAccessAvailable(UUID userId, UUID excludeId) {
        if (userId == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "user_id is required");
        }
        boolean exists = client.query("branch_access.list", Map.of("user_id", userId)).rows().stream()
            .map(OrgBranchAccess::from)
            .anyMatch(a -> Boolean.TRUE.equals(a.isPrimary)
                && "ACTIVE".equals(a.status)
                && (excludeId == null || !excludeId.equals(a.id)));
        if (exists) {
            throw new ApiException(409, OrganizationErrorCode.BRANCH_ACCESS_PRIMARY_EXISTS,
                "User already has a primary branch access", Map.of("user_id", userId.toString()));
        }
    }

    private void emit(String eventType, Object aggregateId, Map<String, Object> payload) {
        Map<String, Object> params = new HashMap<>();
        params.put("event_type", eventType);
        params.put("aggregate_id", UUID.fromString(String.valueOf(aggregateId)));
        try {
            params.put("payload", objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            params.put("payload", "{}");
        }
        params.put("status", "PENDING");
        params.put("retry_count", 0);
        params.put("next_retry_at", null);
        client.write("outbox.insert", params);
    }

    private static void requireBody(Object request) {
        if (request == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "Request body is required");
        }
    }

    private static Map<String, Object> first(List<Map<String, Object>> rows) {
        return rows == null || rows.isEmpty() ? null : rows.get(0);
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
