package com.vn9melody.openerp.modules.plugin.data;

import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.jboss.logging.Logger;

/**
 * P5: the core owns every plugin schema. On startup it ensures each active
 * plugin's schema exists and applies the migrations declared by the published
 * manifest (bundle from artifact storage or the mounted migration directory).
 * Plugin containers no longer run Flyway or hold database credentials.
 */
@ApplicationScoped
public class PluginSchemaBootstrap {

    private static final Logger LOG = Logger.getLogger(PluginSchemaBootstrap.class);

    @Inject
    DataSource dataSource;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginMigrationExecutor migrationExecutor;

    void onStart(@Observes StartupEvent event) {
        for (TenantPlugin ledger : tenantPluginRepository.list("status", TenantPluginStatus.ACTIVE)) {
            if (ledger.storageSchema == null || ledger.storageSchema.isBlank()
                    || ledger.installedVersion == null || ledger.installedVersion.isBlank()) {
                continue;
            }
            PluginCatalog catalog = catalogRepository.findById(ledger.catalogId);
            if (catalog == null) {
                continue;
            }
            PluginVersion version = versionRepository
                    .findByCatalogAndVersion(catalog.id, ledger.installedVersion)
                    .orElse(null);
            if (version == null) {
                continue;
            }
            try {
                ensureSchema(ledger.storageSchema);
                int applied = migrationExecutor.migrate(ledger.pluginKey, version.version,
                        version.manifest, version.distribution, ledger.storageSchema);
                if (applied > 0) {
                    LOG.infof("Plugin schema ready: %s@%s tenant=%s schema=%s (%d migration(s))",
                            ledger.pluginKey, ledger.installedVersion, ledger.tenantId,
                            ledger.storageSchema, applied);
                }
            } catch (RuntimeException e) {
                LOG.warnf("Plugin schema bootstrap skipped %s/%s: %s",
                        ledger.pluginKey, ledger.tenantId, e.getMessage());
            }
        }
    }

    private void ensureSchema(String schema) {
        if (!schema.matches("[A-Za-z0-9_]+")) {
            throw new IllegalArgumentException("Invalid plugin schema name");
        }
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA IF NOT EXISTS " + schema);
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot create plugin schema " + schema, e);
        }
    }
}
