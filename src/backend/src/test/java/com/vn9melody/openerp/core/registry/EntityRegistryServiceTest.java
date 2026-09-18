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
    private List<Object[]> coreIamRows() {
        return entityManager.createNativeQuery(
                "SELECT entity_name, table_or_collection, storage_type, schema_definition::text, exported_relations::text "
                    + "FROM sys_entity_registry WHERE plugin_id = 'core-iam'")
            .getResultList();
    }

    @Test
    @Transactional
    @DisplayName("BUG-26: 7 entity IAM được đăng ký tự động vào sys_entity_registry và upsert idempotent")
    public void testCoreIamEntitiesRegisteredOnStartup() {
        List<Object[]> rows = coreIamRows();
        Assertions.assertEquals(7, rows.size(), "Core IAM phải đăng ký đúng 7 entity");

        Map<String, Object[]> byName = rows.stream()
            .collect(Collectors.toMap(row -> (String) row[0], row -> row));

        Assertions.assertTrue(byName.keySet().containsAll(List.of(
            "User", "Tenant", "UserTenant", "UserCredential", "UserTwoFactor", "UserProfile", "PasswordResetToken"
        )), "Thiếu entity IAM trong registry: " + byName.keySet());

        assertEntity(byName, "User", "users");
        assertEntity(byName, "Tenant", "tenants");
        assertEntity(byName, "UserTenant", "user_tenants");
        assertEntity(byName, "UserCredential", "user_credentials");
        assertEntity(byName, "UserTwoFactor", "user_two_factor");
        assertEntity(byName, "UserProfile", "user_profiles");
        assertEntity(byName, "PasswordResetToken", "password_reset_tokens");

        Assertions.assertTrue(((String) byName.get("User")[3]).contains("\"fields\""),
            "schema_definition phải chứa mô tả public fields dạng JSON");
        Assertions.assertTrue(((String) byName.get("UserCredential")[4]).contains("users"),
            "exported_relations phải chứa quan hệ users");

        entityRegistryService.registerAnnotatedEntities();
        Assertions.assertEquals(7, coreIamRows().size(), "Upsert phải idempotent, không nhân bản bản ghi");
    }

    private void assertEntity(Map<String, Object[]> byName, String entityName, String table) {
        Object[] row = byName.get(entityName);
        Assertions.assertNotNull(row, "Không tìm thấy entity " + entityName);
        Assertions.assertEquals(table, row[1], entityName + " phải trỏ đúng bảng");
        Assertions.assertEquals("postgres", row[2], entityName + " phải dùng storage postgres");
    }
}
