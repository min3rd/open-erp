package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Sprint 07: installing the employee plugin must grant least-privilege defaults
 * to manager, staff and viewer system roles (fresh installs, not only upgrades).
 */
@QuarkusTest
public class PluginPermissionSeederTest {

    @Inject
    PluginPermissionSeeder seeder;

    @Inject
    EntityManager entityManager;

    @Test
    @TestTransaction
    @DisplayName("Sprint 07: employee plugin seeds manager/staff/viewer role defaults")
    public void seedsEmployeeRoleDefaults() throws Exception {
        var permissions = new ObjectMapper().readTree("""
            [
              {"code": "employee:profile:read"},
              {"code": "employee:profile:create"},
              {"code": "employee:self:read"},
              {"code": "employee:self:update"},
              {"code": "employee:document:read"},
              {"code": "employee:contract:manage"},
              {"code": "employee:directory:read"},
              {"code": "employee:org-chart:read"},
              {"code": "in-app-notification:notification:read"}
            ]
            """);

        int granted = seeder.seed(UUID.randomUUID(), permissions);
        Assertions.assertTrue(granted > 0, "Seeder phải grant quyền cho system roles");

        Assertions.assertEquals(1L, count("GENERAL_MANAGER", "employee:profile:read"),
            "GENERAL_MANAGER phải đọc được hồ sơ");
        Assertions.assertEquals(1L, count("GENERAL_MANAGER", "employee:self:update"),
            "GENERAL_MANAGER phải tự cập nhật hồ sơ");
        Assertions.assertEquals(1L, count("STAFF", "employee:self:read"),
            "STAFF phải xem hồ sơ của mình");
        Assertions.assertEquals(1L, count("STAFF", "employee:self:update"),
            "STAFF phải gửi được đề xuất");
        Assertions.assertEquals(0L, count("STAFF", "employee:profile:read"),
            "STAFF không được đọc hồ sơ người khác");
        Assertions.assertEquals(0L, count("STAFF", "employee:contract:manage"),
            "STAFF không được quản lý hợp đồng");
        Assertions.assertEquals(1L, count("VIEWER", "employee:profile:read"),
            "VIEWER chỉ đọc hồ sơ");
        Assertions.assertEquals(0L, count("VIEWER", "employee:self:read"),
            "VIEWER không có self-service");
        Assertions.assertEquals(1L, count("STAFF", "in-app-notification:notification:read"),
            "STAFF phải đọc được thông báo in-app của mình");
        Assertions.assertEquals(1L, count("TENANT_ADMIN", "employee:contract:manage"),
            "TENANT_ADMIN nhận toàn bộ quyền plugin");
    }

    private long count(String roleCode, String permissionCode) {
        return ((Number) entityManager.createNativeQuery("""
                SELECT count(*) FROM role_permissions rp
                JOIN roles r ON r.id = rp.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE r.tenant_id IS NULL AND r.code = ?1 AND p.code = ?2
                """)
            .setParameter(1, roleCode)
            .setParameter(2, permissionCode)
            .getSingleResult()).longValue();
    }
}
