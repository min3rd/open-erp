package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugins.catalog.cache.CatalogCache;
import com.vn9melody.openerp.plugins.catalog.gateway.CatalogGateway;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Seeds the tenant-owned catalog types and default grants inside this tenant's
 * schema through the core Plugin Data Gateway. System types (PROVINCE/COMMUNE/
 * INDUSTRY/JOB) are seeded by the plugin schema migration; platform scope skips
 * tenant seeding.
 */
@ApplicationScoped
public class CatalogTenantSeeder {

    private static final Logger LOG = Logger.getLogger(CatalogTenantSeeder.class);

    private static final List<String> DEFAULT_ROLES = List.of("TENANT_OWNER", "TENANT_ADMIN");
    /** The gateway may still be booting when containers start together. */
    private static final int GATEWAY_ATTEMPTS = 6;
    private static final long RETRY_DELAY_MS = 2_000;

    private record TypeSeed(String code, String nameKey, String mode, List<String> relations, boolean freeText) {}

    private static final List<TypeSeed> TENANT_TYPES = List.of(
        new TypeSeed("JOB_TITLE", "CATALOG_TYPE_JOB_TITLE", "DAG", List.of("CLASSIFICATION"), true),
        new TypeSeed("DEPARTMENT", "CATALOG_TYPE_DEPARTMENT", "TREE", List.of("HIERARCHY"), false),
        new TypeSeed("CONTRACT_TYPE", "CATALOG_TYPE_CONTRACT_TYPE", "FLAT", List.of(), false),
        new TypeSeed("SHIFT", "CATALOG_TYPE_SHIFT", "FLAT", List.of(), false),
        new TypeSeed("EDUCATION_LEVEL", "CATALOG_TYPE_EDUCATION_LEVEL", "FLAT", List.of(), false)
    );

    @Inject
    CatalogGateway gateway;

    @Inject
    CatalogCache cache;

    @ConfigProperty(name = "plugin.scope", defaultValue = "tenant")
    String scope;

    @ConfigProperty(name = "plugin.tenant-id")
    java.util.Optional<String> tenantId;

    void onStart(@Observes StartupEvent event) {
        if ("platform".equalsIgnoreCase(scope)) {
            return;
        }
        UUID tenant = tenantId.map(UUID::fromString).orElse(null);
        if (tenant == null) {
            LOG.warn("Catalog tenant seeder skipped: TENANT_ID is not set");
            return;
        }
        for (int attempt = 1; attempt <= GATEWAY_ATTEMPTS; attempt++) {
            try {
                seed(tenant);
                return;
            } catch (RuntimeException e) {
                boolean retry = isGatewayUnavailable(e) && attempt < GATEWAY_ATTEMPTS;
                if (!retry) {
                    LOG.errorf("Catalog tenant seed failed (continuing startup): %s", e.getMessage());
                    return;
                }
                LOG.warnf("Catalog tenant seed waiting for the data gateway (%d/%d)",
                        attempt, GATEWAY_ATTEMPTS);
                try {
                    Thread.sleep(RETRY_DELAY_MS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    private static boolean isGatewayUnavailable(Throwable error) {
        return error instanceof ApiException api
                && ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE.equals(api.getCode());
    }

    /** Idempotent: existing tenant types and grants are left untouched. */
    public void seed(UUID tenant) {
        cache.invalidate(tenant);
        for (TypeSeed seed : TENANT_TYPES) {
            if (gateway.typeByCodeExact(tenant, seed.code()) != null) {
                continue;
            }
            gateway.insertType(tenant, typeParams(seed), false);
        }

        // New types are not in the cache that served the duplicate check above.
        cache.invalidate(tenant);
        List<CatalogType> types = gateway.visibleTypes(tenant).stream()
                .filter(type -> tenant.equals(type.tenantId))
                .toList();
        Instant now = Instant.now();
        int grants = 0;
        for (String role : DEFAULT_ROLES) {
            for (CatalogType type : types) {
                if (gateway.grantByRole(tenant, type.id, role) != null) {
                    continue;
                }
                Map<String, Object> params = new LinkedHashMap<>();
                params.put("type_id", type.id);
                params.put("role_code", role);
                params.put("can_read", true);
                params.put("can_write", true);
                params.put("created_at", now);
                params.put("updated_at", now);
                gateway.write("catalog.grant.insert", params);
                grants++;
            }
        }
        cache.invalidate(tenant);
        LOG.infof("Catalog tenant seed ready for %s: %d types, %d new grants", tenant, types.size(), grants);
    }

    private static Map<String, Object> typeParams(TypeSeed seed) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("code", seed.code());
        params.put("name_key", seed.nameKey());
        params.put("hierarchy_mode", seed.mode());
        params.put("allowed_relations", seed.relations());
        params.put("allow_free_text", seed.freeText());
        return params;
    }
}
