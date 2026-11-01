package com.vn9melody.openerp.core.context;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Core read model for organization scope. The projection is written by the
 * organization/employee plugins through the internal API and is rebuildable
 * from the legacy organization tables during the Sprint 07 cutover.
 */
@ApplicationScoped
public class ScopeProjectionService {

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "openerp.plugin.datasource.schema-prefix", defaultValue = "tenant_")
    String schemaPrefix;

    public record Projection(
        UUID primaryBranchId,
        UUID primaryDepartmentId,
        Set<UUID> memberBranchIds,
        Set<UUID> managedBranchIds,
        Set<UUID> departmentIds
    ) {
    }

    public Optional<Projection> find(UUID tenantId, UUID userId) {
        List<Object[]> rows = entityManager.createNativeQuery(
                "select primary_branch_id, primary_department_id, "
                    + "array_to_string(member_branch_ids, ','), "
                    + "array_to_string(managed_branch_ids, ','), "
                    + "array_to_string(department_ids, ',') "
                    + "from core_user_scope where tenant_id = ?1 and user_id = ?2")
            .setParameter(1, tenantId)
            .setParameter(2, userId)
            .getResultList();
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        Object[] row = rows.get(0);
        return Optional.of(new Projection(
            uuid(row[0]), uuid(row[1]), uuidSet(row[2]), uuidSet(row[3]), uuidSet(row[4])));
    }

    @Transactional
    public void upsert(UUID tenantId, UUID userId, Projection projection, long version) {
        entityManager.createNativeQuery(
                "insert into core_user_scope "
                    + "(tenant_id, user_id, primary_branch_id, primary_department_id, "
                    + "member_branch_ids, managed_branch_ids, department_ids, version, updated_at) "
                    + "values (?1, ?2, ?3, ?4, " 
                    + "case when ?5 = '' then '{}'::uuid[] else string_to_array(?5, ',')::uuid[] end, "
                    + "case when ?6 = '' then '{}'::uuid[] else string_to_array(?6, ',')::uuid[] end, "
                    + "case when ?7 = '' then '{}'::uuid[] else string_to_array(?7, ',')::uuid[] end, "
                    + "?8, now()) "
                    + "on conflict (tenant_id, user_id) do update set "
                    + "primary_branch_id = excluded.primary_branch_id, "
                    + "primary_department_id = excluded.primary_department_id, "
                    + "member_branch_ids = excluded.member_branch_ids, "
                    + "managed_branch_ids = excluded.managed_branch_ids, "
                    + "department_ids = excluded.department_ids, "
                    + "version = core_user_scope.version + 1, updated_at = now() "
                    + "where excluded.version >= core_user_scope.version")
            .setParameter(1, tenantId)
            .setParameter(2, userId)
            .setParameter(3, projection.primaryBranchId())
            .setParameter(4, projection.primaryDepartmentId())
            .setParameter(5, csv(projection.memberBranchIds()))
            .setParameter(6, csv(projection.managedBranchIds()))
            .setParameter(7, csv(projection.departmentIds()))
            .setParameter(8, version)
            .executeUpdate();
    }

    @Transactional
    public void delete(UUID tenantId, UUID userId) {
        entityManager.createNativeQuery(
                "delete from core_user_scope where tenant_id = ?1 and user_id = ?2")
            .setParameter(1, tenantId).setParameter(2, userId).executeUpdate();
        entityManager.createNativeQuery(
                "delete from core_user_manager_edge where tenant_id = ?1 and subordinate_user_id = ?2")
            .setParameter(1, tenantId).setParameter(2, userId).executeUpdate();
    }

    public Set<UUID> subordinates(UUID tenantId, UUID userId) {
        @SuppressWarnings("unchecked")
        List<UUID> rows = entityManager.createNativeQuery(
                "with recursive subs as ("
                    + " select subordinate_user_id from core_user_manager_edge "
                    + " where tenant_id = ?1 and manager_user_id = ?2"
                    + " union"
                    + " select e.subordinate_user_id from core_user_manager_edge e"
                    + " join subs s on e.manager_user_id = s.subordinate_user_id"
                    + " where e.tenant_id = ?1"
                    + ") select distinct subordinate_user_id from subs")
            .setParameter(1, tenantId)
            .setParameter(2, userId)
            .getResultList();
        return new LinkedHashSet<>(rows);
    }

    public Set<UUID> departmentChildren(UUID tenantId, Set<UUID> departmentIds) {
        if (departmentIds == null || departmentIds.isEmpty()) {
            return Set.of();
        }
        @SuppressWarnings("unchecked")
        List<UUID> rows = entityManager.createNativeQuery(
                "select distinct descendant_id from core_department_closure "
                    + "where tenant_id = :tenantId and ancestor_id in (:ids)")
            .setParameter("tenantId", tenantId)
            .setParameter("ids", departmentIds)
            .getResultList();
        return new LinkedHashSet<>(rows);
    }

    @Transactional
    public void replaceClosure(UUID tenantId, List<Object[]> edges) {
        entityManager.createNativeQuery("delete from core_department_closure where tenant_id = ?1")
            .setParameter(1, tenantId).executeUpdate();
        for (Object[] edge : edges) {
            entityManager.createNativeQuery(
                    "insert into core_department_closure "
                        + "(tenant_id, ancestor_id, descendant_id, depth, updated_at) "
                        + "values (?1, ?2, ?3, ?4, now())")
                .setParameter(1, tenantId)
                .setParameter(2, edge[0])
                .setParameter(3, edge[1])
                .setParameter(4, edge[2])
                .executeUpdate();
        }
    }

    /**
     * Rebuild from the organization plugin tables (the single master data source
     * after the Sprint 07 cutover). Safe to call when the plugin schema does not
     * exist yet (leaves the projection empty).
     */
    @Transactional
    public void rebuildFromLegacy(UUID tenantId) {
        entityManager.createNativeQuery("delete from core_user_scope where tenant_id = ?1")
            .setParameter(1, tenantId).executeUpdate();
        entityManager.createNativeQuery("delete from core_user_manager_edge where tenant_id = ?1")
            .setParameter(1, tenantId).executeUpdate();
        entityManager.createNativeQuery("delete from core_department_closure where tenant_id = ?1")
            .setParameter(1, tenantId).executeUpdate();

        rebuildFromPluginTables(tenantId);
    }

    private void rebuildFromPluginTables(UUID tenantId) {
        String schema = pluginSchema(tenantId);
        if (!tableExists(schema + ".plg_organization_memberships")) {
            return;
        }
        entityManager.createNativeQuery(
                "insert into core_user_scope "
                    + "(tenant_id, user_id, primary_branch_id, primary_department_id, "
                    + "member_branch_ids, managed_branch_ids, department_ids, version, updated_at) "
                    + "select m.tenant_id, m.user_id, "
                    + " (array_agg(m.branch_id order by m.is_primary desc, m.joined_at))[1], "
                    + " (array_agg(m.department_id order by m.is_primary desc, m.joined_at))[1], "
                    + " array_agg(distinct m.branch_id), "
                    + " coalesce((select array_agg(distinct a.branch_id) from " + schema
                    + ".plg_organization_branch_access a where a.tenant_id = m.tenant_id "
                    + "   and a.user_id = m.user_id and a.can_manage and a.status = 'ACTIVE'), '{}'::uuid[]), "
                    + " array_agg(distinct m.department_id), 1, now() "
                    + "from " + schema + ".plg_organization_memberships m "
                    + "where m.tenant_id = ?1 and m.status = 'ACTIVE' "
                    + "group by m.tenant_id, m.user_id")
            .setParameter(1, tenantId).executeUpdate();

        entityManager.createNativeQuery(
                "insert into core_user_manager_edge "
                    + "(tenant_id, manager_user_id, subordinate_user_id, source, updated_at) "
                    + "select tenant_id, direct_manager_user_id, user_id, 'ORG', now() "
                    + "from " + schema + ".plg_organization_memberships "
                    + "where tenant_id = ?1 and status = 'ACTIVE' and direct_manager_user_id is not null")
            .setParameter(1, tenantId).executeUpdate();

        entityManager.createNativeQuery(
                "with recursive tree as ("
                    + " select id as ancestor_id, id as descendant_id, 0 as depth "
                    + " from " + schema + ".plg_organization_departments where tenant_id = ?1 "
                    + " union all "
                    + " select t.ancestor_id, d.id, t.depth + 1 "
                    + " from tree t join " + schema
                    + ".plg_organization_departments d on d.parent_id = t.descendant_id "
                    + " where d.tenant_id = ?1"
                    + ") insert into core_department_closure "
                    + "(tenant_id, ancestor_id, descendant_id, depth, updated_at) "
                    + "select ?1, ancestor_id, descendant_id, depth, now() from tree")
            .setParameter(1, tenantId).executeUpdate();
    }

    private boolean tableExists(String qualifiedName) {
        Object result = entityManager.createNativeQuery("select to_regclass(?1)")
            .setParameter(1, qualifiedName)
            .getSingleResult();
        return result != null;
    }

    private String pluginSchema(UUID tenantId) {
        String shortId = tenantId.toString().replace("-", "").substring(0, 8);
        return schemaPrefix + shortId + "_org_structure";
    }

    private static String csv(Set<UUID> values) {
        return values == null || values.isEmpty() ? "" :
            values.stream().map(UUID::toString).collect(Collectors.joining(","));
    }

    private static Set<UUID> uuidSet(Object value) {
        if (value == null) {
            return Set.of();
        }
        String text = String.valueOf(value);
        if (text.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(text.split(","))
            .map(String::trim)
            .filter(item -> !item.isEmpty())
            .map(UUID::fromString)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }
}
