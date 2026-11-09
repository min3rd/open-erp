package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.security.PermissionInvalidationService;
import com.vn9melody.openerp.core.security.events.PermissionInvalidationEvent;
import com.vn9melody.openerp.modules.iam.model.Permission;
import com.vn9melody.openerp.modules.iam.repository.PermissionRepository;
import com.vn9melody.openerp.modules.plugin.api.PluginSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;

/**
 * Permission seeding on plugin install (TASK-309 / BR-PLG-12): registers the
 * plugin permission codes in the catalog and grants them to the TENANT_OWNER
 * and TENANT_ADMIN system roles, then invalidates cached security contexts.
 */
@ApplicationScoped
public class PluginPermissionSeeder {

    @Inject
    PermissionRepository permissionRepository;

    @Inject
    EntityManager entityManager;

    @Inject
    PermissionInvalidationService invalidationService;

    @Transactional
    public int seed(UUID tenantId, JsonNode permissions) {
        if (tenantId == null || permissions == null || !permissions.isArray()) {
            return 0;
        }
        int granted = 0;
        for (JsonNode node : permissions) {
            String code = node.isTextual() ? node.asText() : node.path("code").asText(null);
            if (code == null || !PluginSupport.isValidPermission(code)) {
                continue;
            }
            Permission permission = permissionRepository.findByCode(code);
            if (permission == null) {
                String[] parts = code.split(":");
                permission = new Permission();
                permission.code = code;
                permission.domain = parts[0];
                permission.resource = parts[1];
                permission.action = parts[2];
                permission.descriptionKey = "PERM_" + code.toUpperCase().replace(':', '_').replace('-', '_');
                permission.isSystem = false;
                permissionRepository.persist(permission);
            }
            granted += entityManager.createNativeQuery("""
                    INSERT INTO role_permissions (role_id, permission_id, granted_at)
                    SELECT r.id, ?1, NOW() FROM roles r
                    WHERE r.tenant_id IS NULL AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
                    ON CONFLICT (role_id, permission_id) DO NOTHING
                    """)
                    .setParameter(1, permission.id)
                    .executeUpdate();
        }
        granted += seedPluginRoleDefaults();
        if (granted > 0) {
            invalidateTenant(tenantId);
        }
        return granted;
    }

    /**
     * Sprint 07 role defaults: managers get read-only profile access, staff gets
     * self-service, viewers get read-only profile access. Kept idempotent so a
     * reinstall or a second plugin does not duplicate rows.
     */
    private int seedPluginRoleDefaults() {
        return entityManager.createNativeQuery("""
                INSERT INTO role_permissions (role_id, permission_id, granted_at)
                SELECT r.id, p.id, NOW()
                FROM roles r CROSS JOIN permissions p
                WHERE r.tenant_id IS NULL AND (
                    (r.code = 'GENERAL_MANAGER' AND p.code IN (
                        'employee:profile:read', 'employee:self:read', 'employee:self:update',
                        'employee:document:read', 'employee:directory:read', 'employee:org-chart:read',
                        'form:response:read', 'form:response:export',
                        'workflow:task:action', 'workflow:instance:read', 'workflow:report:read'))
                    OR (r.code = 'STAFF' AND p.code IN (
                        'employee:self:read', 'employee:self:update', 'employee:document:read',
                        'employee:directory:read', 'employee:org-chart:read',
                        'form:response:read', 'workflow:task:action', 'workflow:instance:read'))
                    OR (r.code = 'VIEWER' AND p.code IN (
                        'employee:profile:read', 'employee:directory:read', 'employee:org-chart:read',
                        'form:response:read', 'workflow:instance:read', 'workflow:report:read'))
                    OR (r.code IN ('GENERAL_MANAGER', 'STAFF', 'VIEWER')
                        AND p.code = 'in-app-notification:notification:read')
                )
                ON CONFLICT (role_id, permission_id) DO NOTHING
                """)
            .executeUpdate();
    }

    @SuppressWarnings("unchecked")
    public void invalidateTenant(UUID tenantId) {
        List<UUID> userIds = entityManager
                .createNativeQuery("SELECT user_id FROM user_tenants WHERE tenant_id = ?1")
                .setParameter(1, tenantId)
                .getResultList();
        if (userIds.isEmpty()) {
            return;
        }
        invalidationService.publish(new PermissionInvalidationEvent() {
            @Override
            public UUID tenantId() {
                return tenantId;
            }

            @Override
            public List<UUID> affectedUserIds() {
                return userIds;
            }

            @Override
            public String reason() {
                return "PLUGIN_PERMISSION_SEEDED";
            }
        });
    }
}
