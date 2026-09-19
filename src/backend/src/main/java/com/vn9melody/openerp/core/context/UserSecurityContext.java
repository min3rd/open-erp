package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.enums.TenantStatus;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Resolved security context of a tenant user (SOL-02 section 3, TASK-288).
 *
 * <p>Holds functional permissions plus the effective data policies already
 * resolved most-permissive across every role of the user. Instances are cached
 * in Redis under {@code sec:ctx:{tenantId}:{userId}} (TTL 15 minutes) and are
 * invalidated by {@code PermissionInvalidationService} pub/sub events.</p>
 */
public record UserSecurityContext(
    UUID userId,
    UUID tenantId,
    Set<UUID> roleIds,
    Set<String> roleCodes,
    Set<String> functionalPermissions,
    Map<String, Map<DataOperation, DataScope>> dataPolicies,
    UUID departmentId,
    Set<UUID> departmentIds,
    Set<UUID> departmentAndChildIds,
    UUID primaryBranchId,
    Set<UUID> memberBranchIds,
    Set<UUID> managedBranchIds,
    Set<UUID> subordinateUserIds,
    boolean isTenantOwner,
    long contextVersion,
    boolean tenantLocked,
    TenantStatus tenantStatus
) {

    public UserSecurityContext {
        roleIds = immutableSet(roleIds);
        roleCodes = immutableSet(roleCodes);
        functionalPermissions = immutableSet(functionalPermissions);
        departmentIds = immutableSet(departmentIds);
        departmentAndChildIds = immutableSet(departmentAndChildIds);
        memberBranchIds = immutableSet(memberBranchIds);
        managedBranchIds = immutableSet(managedBranchIds);
        subordinateUserIds = immutableSet(subordinateUserIds);
        dataPolicies = immutablePolicies(dataPolicies);
    }

    /** BR-RBAC-08: effective branches are member branches UNION managed branches. */
    public Set<UUID> effectiveBranchIds() {
        Set<UUID> effective = new LinkedHashSet<>(memberBranchIds);
        effective.addAll(managedBranchIds);
        return effective;
    }

    public boolean hasPermission(String permissionCode) {
        return permissionCode != null && functionalPermissions.contains(permissionCode);
    }

    /** Explicit policy for (resource, operation); null when no role defined one. */
    public DataScope explicitScopeFor(String resource, DataOperation operation) {
        if (resource == null) {
            return null;
        }
        Map<DataOperation, DataScope> byOperation = dataPolicies.get(resource);
        return byOperation != null ? byOperation.get(operation) : null;
    }

    /** Owner ids for OWN_ONLY / OWN_AND_SUBORDINATES predicates. */
    public Set<UUID> ownerIds() {
        Set<UUID> owners = new LinkedHashSet<>();
        if (userId != null) {
            owners.add(userId);
        }
        owners.addAll(subordinateUserIds);
        return owners;
    }

    private static <T> Set<T> immutableSet(Set<T> source) {
        return source == null ? Set.of() : Set.copyOf(source);
    }

    private static Map<String, Map<DataOperation, DataScope>> immutablePolicies(
        Map<String, Map<DataOperation, DataScope>> source) {
        if (source == null || source.isEmpty()) {
            return Map.of();
        }
        Map<String, Map<DataOperation, DataScope>> copy = new HashMap<>();
        source.forEach((resource, byOperation) -> {
            if (resource != null && byOperation != null) {
                copy.put(resource, Map.copyOf(byOperation));
            }
        });
        return Map.copyOf(copy);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private UUID userId;
        private UUID tenantId;
        private Set<UUID> roleIds = new LinkedHashSet<>();
        private Set<String> roleCodes = new LinkedHashSet<>();
        private Set<String> functionalPermissions = new LinkedHashSet<>();
        private final Map<String, Map<DataOperation, DataScope>> dataPolicies = new HashMap<>();
        private UUID departmentId;
        private Set<UUID> departmentIds = new LinkedHashSet<>();
        private Set<UUID> departmentAndChildIds = new LinkedHashSet<>();
        private UUID primaryBranchId;
        private Set<UUID> memberBranchIds = new LinkedHashSet<>();
        private Set<UUID> managedBranchIds = new LinkedHashSet<>();
        private Set<UUID> subordinateUserIds = new LinkedHashSet<>();
        private boolean isTenantOwner;
        private long contextVersion = System.currentTimeMillis();
        private boolean tenantLocked;
        private TenantStatus tenantStatus = TenantStatus.ACTIVE;

        public Builder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public Builder tenantId(UUID tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public Builder roleIds(Set<UUID> roleIds) {
            this.roleIds = roleIds != null ? roleIds : new LinkedHashSet<>();
            return this;
        }

        public Builder roleCodes(Set<String> roleCodes) {
            this.roleCodes = roleCodes != null ? roleCodes : new LinkedHashSet<>();
            return this;
        }

        public Builder functionalPermissions(Set<String> functionalPermissions) {
            this.functionalPermissions = functionalPermissions != null ? functionalPermissions : new LinkedHashSet<>();
            return this;
        }

        public Builder dataPolicies(Map<String, Map<DataOperation, DataScope>> dataPolicies) {
            this.dataPolicies.clear();
            if (dataPolicies != null) {
                dataPolicies.forEach((resource, byOperation) -> {
                    if (resource != null && byOperation != null) {
                        this.dataPolicies.put(resource, new EnumMap<>(byOperation));
                    }
                });
            }
            return this;
        }

        public Builder departmentId(UUID departmentId) {
            this.departmentId = departmentId;
            return this;
        }

        public Builder departmentIds(Set<UUID> departmentIds) {
            this.departmentIds = departmentIds != null ? departmentIds : new LinkedHashSet<>();
            return this;
        }

        public Builder departmentAndChildIds(Set<UUID> departmentAndChildIds) {
            this.departmentAndChildIds = departmentAndChildIds != null ? departmentAndChildIds : new LinkedHashSet<>();
            return this;
        }

        public Builder primaryBranchId(UUID primaryBranchId) {
            this.primaryBranchId = primaryBranchId;
            return this;
        }

        public Builder memberBranchIds(Set<UUID> memberBranchIds) {
            this.memberBranchIds = memberBranchIds != null ? memberBranchIds : new LinkedHashSet<>();
            return this;
        }

        public Builder managedBranchIds(Set<UUID> managedBranchIds) {
            this.managedBranchIds = managedBranchIds != null ? managedBranchIds : new LinkedHashSet<>();
            return this;
        }

        public Builder subordinateUserIds(Set<UUID> subordinateUserIds) {
            this.subordinateUserIds = subordinateUserIds != null ? subordinateUserIds : new LinkedHashSet<>();
            return this;
        }

        public Builder isTenantOwner(boolean isTenantOwner) {
            this.isTenantOwner = isTenantOwner;
            return this;
        }

        public Builder contextVersion(long contextVersion) {
            this.contextVersion = contextVersion;
            return this;
        }

        public Builder tenantLocked(boolean tenantLocked) {
            this.tenantLocked = tenantLocked;
            return this;
        }

        public Builder tenantStatus(TenantStatus tenantStatus) {
            this.tenantStatus = tenantStatus;
            return this;
        }

        public UserSecurityContext build() {
            return new UserSecurityContext(userId, tenantId, roleIds, roleCodes, functionalPermissions,
                dataPolicies, departmentId, departmentIds, departmentAndChildIds, primaryBranchId,
                memberBranchIds, managedBranchIds, subordinateUserIds, isTenantOwner, contextVersion,
                tenantLocked, tenantStatus);
        }
    }
}
