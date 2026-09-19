package com.vn9melody.openerp.core.registry;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class EntityRegistryServiceTest {

    @Inject
    EntityManager entityManager;

    @Inject
    EntityRegistryService entityRegistryService;

    @SuppressWarnings("unchecked")
    private List<Object[]> registryRows() {
        return entityManager.createNativeQuery(
                "SELECT plugin_id, entity_name, table_or_collection, storage_type, schema_definition::text, exported_relations::text "
                    + "FROM sys_entity_registry")
            .getResultList();
    }

    @Test
    @Transactional
    @DisplayName("BUG-26 + TASK-276: 20 entity IAM/Platform/Organization/Core được đăng ký tự động và upsert idempotent")
    public void testAllEntitiesRegisteredOnStartup() {
        List<Object[]> rows = registryRows();
        Assertions.assertEquals(20, rows.size(), "Phải đăng ký đúng 20 entity (7 core-iam gốc + 13 entity Sprint 02)");

        Map<String, List<Object[]>> byPlugin = rows.stream()
            .collect(Collectors.groupingBy(row -> (String) row[0]));

        Map<String, Object[]> coreIam = byEntityName(byPlugin, "core-iam");
        Assertions.assertEquals(12, coreIam.size(),
            "core-iam phải chứa 7 entity Sprint 01 + 5 entity IAM Sprint 02");
        Assertions.assertTrue(coreIam.keySet().containsAll(List.of(
            "User", "Tenant", "UserTenant", "UserCredential", "UserTwoFactor", "UserProfile", "PasswordResetToken",
            "Permission", "Role", "RolePermission", "UserRole", "RoleDataPolicy"
        )), "Thiếu entity core-iam trong registry: " + coreIam.keySet());

        Map<String, Object[]> platform = byEntityName(byPlugin, "core-platform");
        Assertions.assertEquals(3, platform.size(), "core-platform phải chứa 3 entity");
        Assertions.assertTrue(platform.keySet().containsAll(List.of(
            "PlatformSuperAdmin", "PlatformImpersonationLog", "PlatformAuditLog"
        )), "Thiếu entity core-platform trong registry: " + platform.keySet());

        Map<String, Object[]> organization = byEntityName(byPlugin, "core-organization");
        Assertions.assertEquals(4, organization.size(), "core-organization phải chứa 4 entity");
        Assertions.assertTrue(organization.keySet().containsAll(List.of(
            "Branch", "Department", "UserDepartmentMembership", "UserBranchAssignment"
        )), "Thiếu entity core-organization trong registry: " + organization.keySet());

        Map<String, Object[]> core = byEntityName(byPlugin, "core");
        Assertions.assertEquals(1, core.size(), "plugin core phải chứa entity reference CoreSampleRecord");

        assertEntity(coreIam, "User", "users");
        assertEntity(coreIam, "Tenant", "tenants");
        assertEntity(coreIam, "Role", "roles");
        assertEntity(coreIam, "UserRole", "user_roles");
        assertEntity(platform, "PlatformAuditLog", "platform_audit_logs");
        assertEntity(organization, "UserDepartmentMembership", "user_department_memberships");
        assertEntity(core, "CoreSampleRecord", "core_sample_records");

        Assertions.assertTrue(((String) coreIam.get("User")[4]).contains("\"fields\""),
            "schema_definition phải chứa mô tả public fields dạng JSON");
        Assertions.assertTrue(((String) coreIam.get("UserCredential")[5]).contains("users"),
            "exported_relations phải chứa quan hệ users");

        entityRegistryService.registerAnnotatedEntities();
        Assertions.assertEquals(20, registryRows().size(), "Upsert phải idempotent, không nhân bản bản ghi");
    }

    private Map<String, Object[]> byEntityName(Map<String, List<Object[]>> byPlugin, String pluginId) {
        List<Object[]> pluginRows = byPlugin.get(pluginId);
        Assertions.assertNotNull(pluginRows, "Không tìm thấy plugin " + pluginId + " trong registry");
        return pluginRows.stream().collect(Collectors.toMap(row -> (String) row[1], row -> row));
    }

    private void assertEntity(Map<String, Object[]> byName, String entityName, String table) {
        Object[] row = byName.get(entityName);
        Assertions.assertNotNull(row, "Không tìm thấy entity " + entityName);
        Assertions.assertEquals(table, row[2], entityName + " phải trỏ đúng bảng");
        Assertions.assertEquals("postgres", row[3], entityName + " phải dùng storage postgres");
    }
}
