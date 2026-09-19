package com.vn9melody.openerp.core.context;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.modules.iam.model.RoleDataPolicy;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.UserRole;
import com.vn9melody.openerp.modules.organization.model.Department;
import com.vn9melody.openerp.modules.organization.model.UserBranchAssignment;
import com.vn9melody.openerp.modules.organization.model.UserDepartmentMembership;
import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

/**
 * Builds, caches and exposes the {@link UserSecurityContext} of the current
 * caller (SOL-02 section 3 and 6, TASK-288).
 *
 * <p>Contexts are cached in Redis at {@code sec:ctx:{tenantId}:{userId}} for
 * {@value #CONTEXT_TTL_SECONDS} seconds. Cache entries are deleted by the
 * {@code PermissionInvalidationService} subscriber whenever roles, policies,
 * memberships or branch assignments change.</p>
 */
@ApplicationScoped
public class SecurityContextService {

    public static final long CONTEXT_TTL_SECONDS = 900;
    public static final String CONTEXT_KEY_PREFIX = "sec:ctx:";

    public static final String CLAIM_TENANT_ID = "tenant_id";
    public static final String CLAIM_PLATFORM_ROLE = "platform_role";
    public static final String CLAIM_SCOPE = "scope";
    public static final String CLAIM_IS_IMPERSONATION = "is_impersonation";
    public static final String SCOPE_PLATFORM = "PLATFORM";

    private static final String TENANT_OWNER_ROLE_CODE = "TENANT_OWNER";
    private static final Logger LOG = Logger.getLogger(SecurityContextService.class);

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    JsonWebToken jwt;

    /** Cached or freshly built context. Cache failures fall back to the database. */
    public UserSecurityContext getContext(UUID tenantId, UUID userId) {
        if (tenantId == null || userId == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Tenant and user are required to resolve security context");
        }
        String key = contextKey(tenantId, userId);
        try {
            String cached = redis.value(String.class).get(key);
            if (cached != null && !cached.isBlank()) {
                return objectMapper.readValue(cached, UserSecurityContext.class);
            }
        } catch (Exception e) {
            LOG.warnf("Security context cache read failed for %s: %s", key, e.getMessage());
        }

        UserSecurityContext context = buildContext(tenantId, userId);
        try {
            redis.value(String.class).setex(key, CONTEXT_TTL_SECONDS, objectMapper.writeValueAsString(context));
        } catch (Exception e) {
            LOG.warnf("Security context cache write failed for %s: %s", key, e.getMessage());
        }
        return context;
    }

    /** Deletes one cached context immediately (used by tests and local invalidation). */
    public void invalidate(UUID tenantId, UUID userId) {
        if (tenantId == null || userId == null) {
            return;
        }
        try {
            redis.key(String.class).del(contextKey(tenantId, userId));
        } catch (Exception e) {
            LOG.warnf("Security context cache invalidation failed: %s", e.getMessage());
        }
    }

    public String contextKey(UUID tenantId, UUID userId) {
        return CONTEXT_KEY_PREFIX + tenantId + ":" + userId;
    }

    /** Full database resolution: tenant guard, roles, permissions, policies, scope sets. */
    public UserSecurityContext buildContext(UUID tenantId, UUID userId) {
        Tenant tenant = entityManager.find(Tenant.class, tenantId);
        if (tenant == null) {
            throw new ApiException(404, ErrorCode.TENANT_NOT_FOUND, "Tenant not found");
        }
        assertTenantOperational(tenant);

        List<UUID> roleIds = entityManager.createQuery(
                "select ur.roleId from UserRole ur where ur.userId = :userId and ur.tenantId = :tenantId", UUID.class)
            .setParameter("userId", userId)
            .setParameter("tenantId", tenantId)
            .getResultList();

        Map<UUID, String> roleCodeById = new HashMap<>();
        if (!roleIds.isEmpty()) {
            List<Object[]> roles = entityManager.createQuery(
                    "select r.id, r.code from Role r where r.id in :roleIds", Object[].class)
                .setParameter("roleIds", roleIds)
                .getResultList();
            for (Object[] row : roles) {
                roleCodeById.put((UUID) row[0], (String) row[1]);
            }
        }
        Set<String> roleCodes = new LinkedHashSet<>(roleCodeById.values());

        Set<String> functionalPermissions = new LinkedHashSet<>();
        if (!roleIds.isEmpty()) {
            functionalPermissions.addAll(entityManager.createQuery(
                    "select distinct p.code from Permission p, RolePermission rp "
                        + "where rp.roleId in :roleIds and rp.permissionId = p.id", String.class)
                .setParameter("roleIds", roleIds)
                .getResultList());
        }

        Map<String, Map<DataOperation, DataScope>> dataPolicies = resolveDataPolicies(tenantId, roleIds);

        List<UserDepartmentMembership> memberships = entityManager.createQuery(
                "select m from UserDepartmentMembership m where m.userId = :userId and m.tenantId = :tenantId "
                    + "order by m.isPrimary desc, m.joinedAt asc", UserDepartmentMembership.class)
            .setParameter("userId", userId)
            .setParameter("tenantId", tenantId)
            .getResultList();

        Set<UUID> memberBranchIds = new LinkedHashSet<>();
        Set<UUID> departmentIds = new LinkedHashSet<>();
        UUID primaryDepartmentId = null;
        for (UserDepartmentMembership membership : memberships) {
            if (membership.branchId != null) {
                memberBranchIds.add(membership.branchId);
            }
            if (membership.departmentId != null) {
                departmentIds.add(membership.departmentId);
            }
            if (primaryDepartmentId == null || Boolean.TRUE.equals(membership.isPrimary)) {
                primaryDepartmentId = membership.departmentId != null ? membership.departmentId : primaryDepartmentId;
            }
        }

        List<UserBranchAssignment> branchAssignments = entityManager.createQuery(
                "select a from UserBranchAssignment a where a.userId = :userId and a.tenantId = :tenantId",
                UserBranchAssignment.class)
            .setParameter("userId", userId)
            .setParameter("tenantId", tenantId)
            .getResultList();

        Set<UUID> managedBranchIds = new LinkedHashSet<>();
        UUID primaryBranchId = null;
        for (UserBranchAssignment assignment : branchAssignments) {
            if (Boolean.TRUE.equals(assignment.canManage) && assignment.branchId != null) {
                managedBranchIds.add(assignment.branchId);
            }
            if (Boolean.TRUE.equals(assignment.isPrimary) && assignment.branchId != null) {
                primaryBranchId = assignment.branchId;
            }
        }
        if (primaryBranchId == null) {
            for (UserDepartmentMembership membership : memberships) {
                if (Boolean.TRUE.equals(membership.isPrimary) && membership.branchId != null) {
                    primaryBranchId = membership.branchId;
                    break;
                }
            }
        }

        List<Department> departments = entityManager.createQuery(
                "select d from Department d where d.tenantId = :tenantId", Department.class)
            .setParameter("tenantId", tenantId)
            .getResultList();

        Set<UUID> departmentAndChildIds = expandDepartmentSubtrees(departments, departmentIds);
        Set<UUID> subordinateUserIds = resolveSubordinateIds(tenantId, userId, departments);

        return UserSecurityContext.builder()
            .userId(userId)
            .tenantId(tenantId)
            .roleIds(new LinkedHashSet<>(roleIds))
            .roleCodes(roleCodes)
            .functionalPermissions(functionalPermissions)
            .dataPolicies(dataPolicies)
            .departmentId(primaryDepartmentId)
            .departmentIds(departmentIds)
            .departmentAndChildIds(departmentAndChildIds)
            .primaryBranchId(primaryBranchId)
            .memberBranchIds(memberBranchIds)
            .managedBranchIds(managedBranchIds)
            .subordinateUserIds(subordinateUserIds)
            .isTenantOwner(roleCodes.contains(TENANT_OWNER_ROLE_CODE))
            .tenantLocked(Boolean.TRUE.equals(tenant.isLocked))
            .tenantStatus(tenant.status)
            .build();
    }

    /** Context of the caller, resolved from the JWT claims {@code sub} + {@code tenant_id}. */
    public UserSecurityContext getCurrentContext() {
        TokenClaims claims = currentClaims();
        if (claims.userId() == null || claims.tenantId() == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Unauthorized access: valid token required");
        }
        if (claims.platformToken()) {
            throw new ApiException(403, ErrorCode.FORBIDDEN,
                "Platform token cannot resolve a tenant security context");
        }
        return getContext(claims.tenantId(), claims.userId());
    }

    public TokenClaims currentClaims() {
        String subject = claim(jwt, "sub");
        String tenantIdClaim = claim(jwt, CLAIM_TENANT_ID);
        String platformRole = claim(jwt, CLAIM_PLATFORM_ROLE);
        String scope = claim(jwt, CLAIM_SCOPE);
        Boolean impersonation = null;
        try {
            Object value = jwt.getClaim(CLAIM_IS_IMPERSONATION);
            if (value instanceof Boolean bool) {
                impersonation = bool;
            } else if (value instanceof String text) {
                impersonation = Boolean.parseBoolean(text);
            }
        } catch (Exception ignored) {
            // anonymous request
        }

        UUID userId = parseUuid(subject);
        UUID tenantId = parseUuid(tenantIdClaim);
        boolean platformToken = (platformRole != null && !platformRole.isBlank())
            || SCOPE_PLATFORM.equalsIgnoreCase(scope);
        return new TokenClaims(userId, tenantId, platformRole, scope, Boolean.TRUE.equals(impersonation), platformToken);
    }

    /** True when the current token is a platform administration token. */
    public boolean isPlatformToken() {
        return currentClaims().platformToken();
    }

    private Map<String, Map<DataOperation, DataScope>> resolveDataPolicies(UUID tenantId, List<UUID> roleIds) {
        Map<String, Map<DataOperation, DataScope>> policies = new HashMap<>();
        if (roleIds.isEmpty()) {
            return policies;
        }
        List<RoleDataPolicy> rows = entityManager.createQuery(
                "select p from RoleDataPolicy p where p.tenantId = :tenantId and p.roleId in :roleIds",
                RoleDataPolicy.class)
            .setParameter("tenantId", tenantId)
            .setParameter("roleIds", roleIds)
            .getResultList();

        for (RoleDataPolicy row : rows) {
            if (row.resource == null) {
                continue;
            }
            Map<DataOperation, DataScope> byOperation =
                policies.computeIfAbsent(row.resource, key -> new EnumMap<>(DataOperation.class));
            mergeScope(byOperation, DataOperation.CREATE, row.createScope);
            mergeScope(byOperation, DataOperation.READ, row.readScope);
            mergeScope(byOperation, DataOperation.UPDATE, row.updateScope);
            mergeScope(byOperation, DataOperation.DELETE, row.deleteScope);
            mergeScope(byOperation, DataOperation.EXPORT, row.exportScope);
            mergeScope(byOperation, DataOperation.SHARE, row.shareScope);
        }
        return policies;
    }

    private void mergeScope(Map<DataOperation, DataScope> byOperation, DataOperation operation, DataScope scope) {
        DataScope resolved = scope != null ? scope : DataScope.NONE;
        byOperation.merge(operation, resolved, (left, right) -> left.mostPermissive(right));
    }

    private Set<UUID> expandDepartmentSubtrees(List<Department> departments, Set<UUID> rootIds) {
        if (rootIds.isEmpty()) {
            return Set.of();
        }
        Map<UUID, Set<UUID>> childrenByParent = new HashMap<>();
        for (Department department : departments) {
            if (department.parentId != null) {
                childrenByParent.computeIfAbsent(department.parentId, key -> new HashSet<>()).add(department.id);
            }
        }
        Set<UUID> result = new LinkedHashSet<>();
        Deque<UUID> queue = new ArrayDeque<>(rootIds);
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            if (current == null || !result.add(current)) {
                continue;
            }
            Set<UUID> children = childrenByParent.get(current);
            if (children != null) {
                queue.addAll(children);
            }
        }
        return result;
    }

    /**
     * Resolves subordinate users from the reporting line
     * ({@code user_department_memberships.direct_manager_user_id}, recursive) plus the
     * manager of the user's departments (and their sub-departments).
     */
    @SuppressWarnings("unchecked")
    private Set<UUID> resolveSubordinateIds(UUID tenantId, UUID userId, List<Department> departments) {
        Set<UUID> subordinates = new LinkedHashSet<>();

        List<UUID> viaReportingLine = entityManager.createNativeQuery(
                "WITH RECURSIVE subs AS ("
                    + " SELECT m.user_id FROM user_department_memberships m"
                    + " WHERE m.tenant_id = :tenantId AND m.direct_manager_user_id = :userId"
                    + " UNION"
                    + " SELECT m.user_id FROM user_department_memberships m"
                    + " JOIN subs s ON m.direct_manager_user_id = s.user_id"
                    + " WHERE m.tenant_id = :tenantId"
                    + ") SELECT DISTINCT user_id FROM subs", UUID.class)
            .setParameter("tenantId", tenantId)
            .setParameter("userId", userId)
            .getResultList();
        subordinates.addAll(viaReportingLine);

        Set<UUID> managedDepartmentRoots = new LinkedHashSet<>();
        for (Department department : departments) {
            if (userId.equals(department.managerUserId)) {
                managedDepartmentRoots.add(department.id);
            }
        }
        if (!managedDepartmentRoots.isEmpty()) {
            Set<UUID> managedDepartments = expandDepartmentSubtrees(departments, managedDepartmentRoots);
            List<UUID> viaDepartment = entityManager.createQuery(
                    "select distinct m.userId from UserDepartmentMembership m "
                        + "where m.tenantId = :tenantId and m.departmentId in :departmentIds", UUID.class)
                .setParameter("tenantId", tenantId)
                .setParameter("departmentIds", managedDepartments)
                .getResultList();
            subordinates.addAll(viaDepartment);
        }

        subordinates.remove(userId);
        return subordinates;
    }

    private void assertTenantOperational(Tenant tenant) {
        if (Boolean.TRUE.equals(tenant.isLocked)) {
            throw new ApiException(403, ErrorCode.TENANT_LOCKED, "Tenant is locked");
        }
        TenantStatus status = tenant.status != null ? tenant.status : TenantStatus.ACTIVE;
        switch (status) {
            case SUSPENDED, EXPIRED -> throw new ApiException(403, ErrorCode.TENANT_SUSPENDED, "Tenant is suspended");
            case PENDING_DELETION, DELETED ->
                throw new ApiException(404, ErrorCode.TENANT_NOT_FOUND, "Tenant not found");
            default -> {
                // ACTIVE / TRIAL are operational
            }
        }
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String claim(JsonWebToken token, String name) {
        if (token == null) {
            return null;
        }
        try {
            return token.getClaim(name);
        } catch (Exception e) {
            return null;
        }
    }

    /** Decoded claims of the current bearer token. */
    public record TokenClaims(
        UUID userId,
        UUID tenantId,
        String platformRole,
        String scope,
        boolean impersonation,
        boolean platformToken
    ) {
        public boolean isPlatformToken() {
            return platformToken;
        }
    }
}
