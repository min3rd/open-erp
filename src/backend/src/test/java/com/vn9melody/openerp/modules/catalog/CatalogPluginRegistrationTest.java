package com.vn9melody.openerp.modules.catalog;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import com.vn9melody.openerp.modules.catalog.repository.CatalogTypeRepository;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.plugin.service.PluginProvisioningService;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-375/TASK-376: verifies the migration seeds (plugin row, permissions,
 * system types) and the always-on provisioning hook for new tenants.
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogPluginRegistrationTest {

    @Inject
    EntityManager entityManager;

    @Inject
    CatalogTypeRepository typeRepository;

    @Inject
    PluginProvisioningService provisioningService;

    @AfterEach
    void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> S2IamFixtures.cleanup());
    }

    @Test
    @Transactional
    @DisplayName("AC-13/AC-14: catalog plugin row is locked + default_install (is_core FALSE, Sprint 03 Q4)")
    void catalogPluginRowIsLockedDefault() {
        Object[] row = (Object[]) entityManager.createNativeQuery(
                "SELECT default_install, locked, is_core, catalog_status, name_key, description_key "
                    + "FROM plugin_catalog WHERE plugin_key = 'catalog'")
            .getSingleResult();
        assertEquals(Boolean.TRUE, row[0]);
        assertEquals(Boolean.TRUE, row[1]);
        assertEquals(Boolean.FALSE, row[2]);
        assertEquals("ACTIVE", row[3]);
        assertEquals("PLUGIN_CATALOG_NAME", row[4]);
        assertEquals("PLUGIN_CATALOG_DESCRIPTION", row[5]);
    }

    @Test
    @Transactional
    @DisplayName("TASK-375: system types, permissions and tenant role grants are seeded")
    void systemTypesAndPermissionsAreSeeded() {
        CatalogType province = typeRepository.findSystemByCode("PROVINCE");
        CatalogType district = typeRepository.findSystemByCode("DISTRICT");
        CatalogType commune = typeRepository.findSystemByCode("COMMUNE");
        CatalogType industry = typeRepository.findSystemByCode("INDUSTRY");
        CatalogType job = typeRepository.findSystemByCode("JOB");
        assertNotNull(province);
        assertNotNull(district);
        assertNotNull(commune);
        assertNotNull(industry);
        assertNotNull(job);

        assertNull(province.allowedParentTypes, "PROVINCE accepts same-type parents only (NULL)");
        assertArrayEquals(new String[]{"PROVINCE"}, district.allowedParentTypes);
        assertArrayEquals(new String[]{"PROVINCE", "DISTRICT"}, commune.allowedParentTypes);
        assertNull(industry.allowedParentTypes, "INDUSTRY accepts same-type parents only (NULL)");
        assertArrayEquals(new String[]{"INDUSTRY"}, job.allowedParentTypes);
        assertEquals(CatalogHierarchyMode.TREE, province.hierarchyMode);
        assertEquals(CatalogHierarchyMode.DAG, industry.hierarchyMode);
        assertFalse(province.allowFreeText);
        assertTrue(job.allowFreeText, "JOB allows free text per DES-DB 5.3");

        assertEquals(5L, count("SELECT count(*) FROM permissions WHERE code IN "
            + "('catalog:type:manage', 'catalog:item:read', 'catalog:item:manage', "
            + "'catalog:item:inline-create', 'catalog:system:manage')"));
        assertEquals(8L, count("""
            SELECT count(*) FROM role_permissions rp
            JOIN roles r ON r.id = rp.role_id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE r.tenant_id IS NULL AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
              AND p.code IN ('catalog:type:manage', 'catalog:item:read',
                             'catalog:item:manage', 'catalog:item:inline-create')
            """), "the four tenant permissions are granted to both admin roles");
        assertEquals(0L, count("""
            SELECT count(*) FROM role_permissions rp
            JOIN roles r ON r.id = rp.role_id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE r.tenant_id IS NULL AND p.code = 'catalog:system:manage'
            """), "catalog:system:manage stays platform-only (role guard, not RBAC)");
    }

    @Test
    @DisplayName("D14/AC-14: provisioning a new tenant activates the in-process catalog plugin")
    void provisioningActivatesCatalogForNewTenant() {
        Tenant tenant = QuarkusTransaction.requiringNew().call(() -> S2IamFixtures.createTenant("catalog-prov"));

        int provisioned = QuarkusTransaction.requiringNew()
            .call(() -> provisioningService.provisionDefaults(tenant.id));
        assertTrue(provisioned >= 1, "the catalog default must be provisioned");

        Object[] ledger = QuarkusTransaction.requiringNew().call(() -> (Object[]) entityManager.createNativeQuery(
                "SELECT status, installed_version FROM tenant_plugins "
                    + "WHERE tenant_id = ?1 AND plugin_key = 'catalog'")
            .setParameter(1, tenant.id)
            .getSingleResult());
        assertEquals("ACTIVE", ledger[0]);
        assertNotNull(ledger[1]);

        Boolean entitled = QuarkusTransaction.requiringNew().call(() -> (Boolean) entityManager.createNativeQuery(
                "SELECT allowed_plugins @> '[\"catalog\"]'::jsonb FROM tenants WHERE id = ?1")
            .setParameter(1, tenant.id)
            .getSingleResult());
        assertEquals(Boolean.TRUE, entitled);
    }

    private long count(String sql) {
        Number result = (Number) entityManager.createNativeQuery(sql).getSingleResult();
        return result == null ? 0L : result.longValue();
    }
}
