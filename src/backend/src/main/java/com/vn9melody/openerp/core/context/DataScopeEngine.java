package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.enums.ResponseKey;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Data Permission Enforcement Engine facade (SOL-02, FEAT-15/FEAT-16).
 *
 * <p>Reads are filtered automatically through Hibernate {@code @Filter}s
 * (enabled by {@link DataScopeFilterEnabler}); mutations and exports are checked
 * explicitly with {@link #canMutate} and {@link #assertExportAllowed} so they
 * never rely on the read filter.</p>
 */
@ApplicationScoped
public class DataScopeEngine {

    private final DataScopeResolver resolver;
    private final DataScopeFilterEnabler filterEnabler;

    @Inject
    public DataScopeEngine(DataScopeResolver resolver, DataScopeFilterEnabler filterEnabler) {
        this.resolver = resolver;
        this.filterEnabler = filterEnabler;
    }

    public DataScope resolveScope(UserSecurityContext context, String resource, DataOperation operation) {
        return resolver.resolve(context, resource, operation);
    }

    /** Enables the Hibernate filter for a read/export query on the reference entity. */
    public DataScope applyScopeFilter(UserSecurityContext context, String resource, DataOperation operation) {
        return filterEnabler.enable(context, resource, operation);
    }

    public DataScope applyReadFilter(UserSecurityContext context, String resource) {
        return applyScopeFilter(context, resource, DataOperation.READ);
    }

    public void clearFilters() {
        filterEnabler.disableAll();
    }

    /**
     * Explicit scope check for UPDATE/DELETE/EXPORT/SHARE (SOL-02 section 4.3).
     * Returns false when the target row sits outside the resolved scope.
     */
    public boolean canMutate(UserSecurityContext context, String resource, DataOperation operation,
                             DataScopeTarget target) {
        if (context == null || target == null) {
            return false;
        }
        DataScope scope = resolver.resolve(context, resource, operation);
        return switch (scope) {
            case NONE -> false;
            case ALL -> true;
            case BRANCH -> target.branchId() != null && context.effectiveBranchIds().contains(target.branchId());
            case DEPARTMENT ->
                target.departmentId() != null && context.departmentIds().contains(target.departmentId());
            case DEPARTMENT_AND_CHILDREN ->
                target.departmentId() != null && context.departmentAndChildIds().contains(target.departmentId());
            case OWN_ONLY -> owns(context, target, context.userId() != null ? Set.of(context.userId()) : Set.of());
            case OWN_AND_SUBORDINATES -> owns(context, target, context.ownerIds());
        };
    }

    /** Throws {@code IAM_PERMISSION_DENIED_DATA_SCOPE} when the row is out of scope. */
    public void assertCanMutate(UserSecurityContext context, String resource, DataOperation operation,
                                DataScopeTarget target) {
        if (!canMutate(context, resource, operation, target)) {
            throw deniedDataScope(resource, operation);
        }
    }

    /**
     * Applies the CREATE rules of SOL-02 section 4: default branch is the primary
     * branch, department/branch must belong to the effective scope and the caller
     * always becomes the owner.
     */
    public DataScopeTarget resolveCreateTarget(UserSecurityContext context, String resource,
                                               UUID requestedBranchId, UUID requestedDepartmentId) {
        DataScope scope = resolver.resolve(context, resource, DataOperation.CREATE);
        if (scope == DataScope.NONE) {
            throw deniedDataScope(resource, DataOperation.CREATE);
        }

        UUID branchId = requestedBranchId;
        UUID departmentId = requestedDepartmentId;
        switch (scope) {
            case ALL -> {
                if (branchId == null) {
                    branchId = context.primaryBranchId();
                }
            }
            case BRANCH -> {
                if (branchId == null) {
                    branchId = context.primaryBranchId();
                }
                if (branchId == null || !context.effectiveBranchIds().contains(branchId)) {
                    throw deniedDataScope(resource, DataOperation.CREATE);
                }
            }
            case DEPARTMENT, DEPARTMENT_AND_CHILDREN -> {
                Set<UUID> allowedDepartments = scope == DataScope.DEPARTMENT
                    ? context.departmentIds()
                    : context.departmentAndChildIds();
                if (departmentId == null) {
                    departmentId = context.departmentId();
                }
                if (departmentId == null || !allowedDepartments.contains(departmentId)) {
                    throw deniedDataScope(resource, DataOperation.CREATE);
                }
                if (branchId == null) {
                    branchId = context.primaryBranchId();
                }
            }
            case OWN_ONLY, OWN_AND_SUBORDINATES -> {
                if (branchId == null) {
                    branchId = context.primaryBranchId();
                }
                if (departmentId == null) {
                    departmentId = context.departmentId();
                }
            }
            default -> throw deniedDataScope(resource, DataOperation.CREATE);
        }

        return new DataScopeTarget(branchId, departmentId, context.userId(), null);
    }

    /** EXPORT scope guard: {@code NONE} is rejected with {@code IAM_PERMISSION_DENIED_EXPORT}. */
    public DataScope assertExportAllowed(UserSecurityContext context, String resource) {
        DataScope scope = resolver.resolve(context, resource, DataOperation.EXPORT);
        if (scope == DataScope.NONE) {
            throw new ApiException(403, ErrorCode.IAM_PERMISSION_DENIED_EXPORT,
                "You are not allowed to export this resource data",
                Map.of(ResponseKey.RESOURCE.getKey(), resource));
        }
        return scope;
    }

    public ApiException deniedDataScope(String resource, DataOperation operation) {
        Map<String, Object> params = new HashMap<>();
        params.put(ResponseKey.RESOURCE.getKey(), resource);
        params.put("operation", operation != null ? operation.name() : null);
        return new ApiException(403, ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE,
            "You cannot access data outside your allowed scope", params);
    }

    private boolean owns(UserSecurityContext context, DataScopeTarget target, Set<UUID> owners) {
        if (owners == null || owners.isEmpty()) {
            return false;
        }
        UUID createdBy = target.createdBy();
        UUID assigneeId = target.assigneeId();
        return (createdBy != null && owners.contains(createdBy))
            || (assigneeId != null && owners.contains(assigneeId));
    }
}
