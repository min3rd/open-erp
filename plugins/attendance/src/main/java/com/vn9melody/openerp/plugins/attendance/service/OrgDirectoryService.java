package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cross-plugin directory lookups. Department/branch names live in the
 * org-structure plugin and employee assignments live in the employee plugin;
 * both are read through the core plugin data gateway (gRPC, READ-only) using
 * namespaced query ids declared as aliases in those manifests.
 */
@ApplicationScoped
public class OrgDirectoryService {

    private static final long CACHE_TTL_SECONDS = 60;

    public record DepartmentRef(UUID id, String name) {}

    public record EmployeeOrg(UUID departmentId, String departmentName,
                              UUID branchId, String branchName) {}

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    private final Map<UUID, CacheEntry> cache = new ConcurrentHashMap<>();

    private record CacheEntry(Map<UUID, EmployeeOrg> employees, Instant expiresAt) {}

    /** employee_id → department of the primary (or first) assignment. */
    public Map<UUID, DepartmentRef> departmentByEmployee() {
        Map<UUID, DepartmentRef> result = new LinkedHashMap<>();
        employeeOrg().forEach((employeeId, org) -> {
            if (org.departmentId() != null) {
                result.put(employeeId, new DepartmentRef(org.departmentId(), org.departmentName()));
            }
        });
        return result;
    }

    /** employee_id → primary department and branch, resolved through gRPC. */
    public Map<UUID, EmployeeOrg> employeeOrg() {
        UUID tenantId = tenantContext.tenantId();
        if (tenantId == null) {
            return Map.of();
        }
        CacheEntry cached = cache.get(tenantId);
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.employees();
        }
        Map<UUID, EmployeeOrg> resolved = load();
        cache.put(tenantId, new CacheEntry(resolved,
                Instant.now().plus(CACHE_TTL_SECONDS, ChronoUnit.SECONDS)));
        return resolved;
    }

    private Map<UUID, EmployeeOrg> load() {
        Map<UUID, String> departmentNames = names("org-structure.department.list");
        Map<UUID, String> branchNames = names("org-structure.branch.list");
        if (departmentNames.isEmpty() && branchNames.isEmpty()) {
            return Map.of();
        }

        Map<UUID, UUID[]> assignmentByEmployee = new LinkedHashMap<>();
        Map<UUID, Boolean> primarySeen = new LinkedHashMap<>();
        try {
            for (Map<String, Object> row : PluginDataPager.listAll(client,
                    "employee.assignment.list", Map.of(), 1000)) {
                UUID employeeId = uuid(row.get("employee_id"));
                if (employeeId == null) {
                    continue;
                }
                UUID departmentId = uuid(row.get("department_id"));
                UUID branchId = uuid(row.get("branch_id"));
                boolean primary = Boolean.TRUE.equals(row.get("is_primary"));
                boolean alreadyPrimary = Boolean.TRUE.equals(primarySeen.get(employeeId));
                if (!assignmentByEmployee.containsKey(employeeId) || (primary && !alreadyPrimary)) {
                    assignmentByEmployee.put(employeeId, new UUID[]{departmentId, branchId});
                    primarySeen.put(employeeId, primary);
                }
            }
        } catch (RuntimeException e) {
            return Map.of();
        }

        Map<UUID, EmployeeOrg> result = new LinkedHashMap<>();
        assignmentByEmployee.forEach((employeeId, ids) ->
                result.put(employeeId, new EmployeeOrg(
                        ids[0], ids[0] != null ? departmentNames.get(ids[0]) : null,
                        ids[1], ids[1] != null ? branchNames.get(ids[1]) : null)));
        return result;
    }

    private Map<UUID, String> names(String queryId) {
        Map<UUID, String> names = new LinkedHashMap<>();
        try {
            for (Map<String, Object> row : PluginDataPager.listAll(client, queryId, Map.of(), 1000)) {
                UUID id = uuid(row.get("id"));
                if (id != null) {
                    names.put(id, row.get("name") != null ? row.get("name").toString() : id.toString());
                }
            }
        } catch (RuntimeException e) {
            // Plugin not installed for this tenant: callers degrade gracefully.
        }
        return names;
    }

    private UUID uuid(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
