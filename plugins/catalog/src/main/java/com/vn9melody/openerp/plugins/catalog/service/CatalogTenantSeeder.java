package com.vn9melody.openerp.plugins.catalog.service;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Seeds the tenant-owned catalog types and default grants inside this tenant's
 * schema. System types (PROVINCE/COMMUNE/INDUSTRY/JOB) are seeded by the Flyway
 * migration; platform scope skips tenant seeding.
 */
@ApplicationScoped
public class CatalogTenantSeeder {

    private static final Logger LOG = Logger.getLogger(CatalogTenantSeeder.class);

    private record TypeSeed(String code, String nameKey, String mode, String relations, boolean freeText) {}

    private static final List<TypeSeed> TENANT_TYPES = List.of(
        new TypeSeed("JOB_TITLE", "CATALOG_TYPE_JOB_TITLE", "DAG", "{CLASSIFICATION}", true),
        new TypeSeed("DEPARTMENT", "CATALOG_TYPE_DEPARTMENT", "TREE", "{HIERARCHY}", false),
        new TypeSeed("CONTRACT_TYPE", "CATALOG_TYPE_CONTRACT_TYPE", "FLAT", "{}", false),
        new TypeSeed("SHIFT", "CATALOG_TYPE_SHIFT", "FLAT", "{}", false),
        new TypeSeed("EDUCATION_LEVEL", "CATALOG_TYPE_EDUCATION_LEVEL", "FLAT", "{}", false)
    );

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "plugin.scope", defaultValue = "tenant")
    String scope;

    @ConfigProperty(name = "plugin.tenant-id")
    java.util.Optional<String> tenantId;

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if ("platform".equalsIgnoreCase(scope)) {
            return;
        }
        UUID tenant = tenantId.map(UUID::fromString).orElse(null);
        if (tenant == null) {
            LOG.warn("Catalog tenant seeder skipped: TENANT_ID is not set");
            return;
        }
        for (TypeSeed type : TENANT_TYPES) {
            entityManager.createNativeQuery("""
                    INSERT INTO catalog_types
                        (tenant_id, code, name_key, hierarchy_mode, allowed_relations, allow_free_text)
                    VALUES (?1, ?2, ?3, ?4, CAST(?5 AS varchar(32)[]), ?6)
                    ON CONFLICT (tenant_id, code) DO NOTHING
                    """)
                .setParameter(1, tenant)
                .setParameter(2, type.code())
                .setParameter(3, type.nameKey())
                .setParameter(4, type.mode())
                .setParameter(5, type.relations())
                .setParameter(6, type.freeText())
                .executeUpdate();
        }
        entityManager.createNativeQuery("""
                INSERT INTO catalog_type_grants (tenant_id, type_id, role_code, can_read, can_write)
                SELECT t.tenant_id, t.id, r.code, TRUE, TRUE
                FROM catalog_types t
                CROSS JOIN (VALUES ('TENANT_OWNER'), ('TENANT_ADMIN')) AS r(code)
                WHERE t.tenant_id = ?1
                ON CONFLICT (tenant_id, type_id, role_code) DO NOTHING
                """)
            .setParameter(1, tenant)
            .executeUpdate();
        LOG.infof("Catalog tenant seed ready for %s", tenant);
    }
}
