package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataResourceItem;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Seeds default data-scope policies for the workspace administrator roles.
 *
 * <p>Root cause it guards against (BUG-117 follow-up): the Data Permission Engine
 * is deny-by-default — a role with functional permissions but no
 * {@code role_data_policies} row resolves to scope {@code NONE}, so every data
 * operation returns {@code IAM_PERMISSION_DENIED_DATA_SCOPE}. Any tenant created
 * before its policies were configured (including every pre-existing tenant) was
 * therefore unusable. This runs idempotently on startup for existing tenants and
 * on tenant provisioning, so a schema/permission upgrade never leaves old data
 * locked out.</p>
 *
 * <p>Scopes seeded: {@code ALL} for {@code TENANT_OWNER} (BR-RBAC-01) and
 * {@code TENANT_ADMIN} (the workspace creator role). Other roles keep the
 * deny-by-default and are configured explicitly.</p>
 */
@ApplicationScoped
public class RoleDataPolicyProvisioningService {

    private static final Logger LOG = Logger.getLogger(RoleDataPolicyProvisioningService.class);

    private static final List<String> ADMIN_ROLE_CODES = List.of("TENANT_OWNER", "TENANT_ADMIN");

    @Inject
    EntityManager entityManager;

    @Inject
    IamDataPolicyService dataPolicyService;

    @Transactional
    public void provisionAdminDefaults(UUID tenantId) {
        if (tenantId == null) {
            return;
        }
        List<DataResourceItem> resources = dataPolicyService.listDataResources();
        if (resources.isEmpty()) {
            return;
        }
        for (String roleCode : ADMIN_ROLE_CODES) {
            UUID roleId = globalRoleId(roleCode);
            if (roleId == null) {
                continue;
            }
            for (DataResourceItem resource : resources) {
                insertAllScopesIfMissing(tenantId, roleId, resource.resource());
            }
        }
    }

    /** Backfills every existing tenant; safe to run repeatedly. */
    @Transactional
    public void provisionAllTenants() {
        @SuppressWarnings("unchecked")
        List<UUID> tenantIds = entityManager
                .createNativeQuery("SELECT id FROM tenants")
                .getResultList();
        for (UUID tenantId : tenantIds) {
            provisionAdminDefaults(tenantId);
        }
        if (!tenantIds.isEmpty()) {
            LOG.infof("Role data-policy defaults ensured for %d tenant(s)", tenantIds.size());
        }
    }

    private UUID globalRoleId(String roleCode) {
        @SuppressWarnings("unchecked")
        List<UUID> ids = entityManager
                .createNativeQuery("SELECT id FROM roles WHERE tenant_id IS NULL AND code = ?1")
                .setParameter(1, roleCode)
                .getResultList();
        return ids.isEmpty() ? null : ids.get(0);
    }

    private void insertAllScopesIfMissing(UUID tenantId, UUID roleId, String resource) {
        // Heal the broken deny-everything default (all six scopes NONE) without
        // overriding a policy an administrator configured on purpose.
        entityManager.createNativeQuery(
                "INSERT INTO role_data_policies "
                    + "(tenant_id, role_id, resource, create_scope, read_scope, update_scope, "
                    + "delete_scope, export_scope, share_scope) "
                    + "VALUES (?1, ?2, ?3, 'ALL', 'ALL', 'ALL', 'ALL', 'ALL', 'ALL') "
                    + "ON CONFLICT (tenant_id, role_id, resource) DO UPDATE SET "
                    + "create_scope='ALL', read_scope='ALL', update_scope='ALL', "
                    + "delete_scope='ALL', export_scope='ALL', share_scope='ALL' "
                    + "WHERE role_data_policies.create_scope='NONE' AND role_data_policies.read_scope='NONE' "
                    + "AND role_data_policies.update_scope='NONE' AND role_data_policies.delete_scope='NONE' "
                    + "AND role_data_policies.export_scope='NONE' AND role_data_policies.share_scope='NONE'")
                .setParameter(1, tenantId)
                .setParameter(2, roleId)
                .setParameter(3, resource)
                .executeUpdate();
    }
}
