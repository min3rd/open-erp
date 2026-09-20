package com.vn9melody.openerp.modules.plugin.datasource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Tenant Datasource Router (SOL-02 section 3, TASK-337): provisions one
 * PostgreSQL schema + login role per (tenant, plugin) with least privilege.
 * Credentials are re-generated on every deploy and never persisted in plain text.
 */
@ApplicationScoped
public class TenantDatasourceService {

    private static final Logger LOG = Logger.getLogger(TenantDatasourceService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "openerp.plugin.datasource.schema-prefix", defaultValue = "tenant_")
    String schemaPrefix;

    @ConfigProperty(name = "quarkus.datasource.jdbc.url")
    String jdbcUrl;

    public record TenantDatasource(String schema, String role, String password, String jdbcUrl) {}

    public TenantDatasource ensureDatasource(UUID tenantId, String pluginKey) {
        if (tenantId == null || pluginKey == null || pluginKey.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_TENANT_DATASOURCE_FAILED,
                    "Tenant and plugin are required");
        }
        String suffix = tenantId.toString().replace("-", "").substring(0, 8);
        String schema = schemaPrefix + suffix + "_" + sanitize(pluginKey);
        String role = schema + "_app";
        String password = randomPassword();
        try {
            entityManager.createNativeQuery("CREATE SCHEMA IF NOT EXISTS " + schema).executeUpdate();
            entityManager.createNativeQuery("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '%s') THEN
                            CREATE ROLE %s LOGIN;
                        END IF;
                    END $$;
                    """.formatted(role, role)).executeUpdate();
            entityManager.createNativeQuery("ALTER ROLE " + role + " WITH PASSWORD '" + password + "'")
                    .executeUpdate();
            entityManager.createNativeQuery("GRANT USAGE, CREATE ON SCHEMA " + schema + " TO " + role)
                    .executeUpdate();
            entityManager.createNativeQuery("REVOKE ALL ON SCHEMA public FROM " + role).executeUpdate();
        } catch (Exception e) {
            LOG.errorf("Plugin datasource provisioning failed for tenant %s plugin %s: %s",
                    tenantId, pluginKey, e.getMessage());
            throw new ApiException(500, PluginErrorCode.PLUGIN_TENANT_DATASOURCE_FAILED,
                    "Cannot provision tenant datasource");
        }
        return new TenantDatasource(schema, role, password, jdbcUrl);
    }

    private String sanitize(String pluginKey) {
        String value = pluginKey.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "_");
        return value.length() > 40 ? value.substring(0, 40) : value;
    }

    private String randomPassword() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
