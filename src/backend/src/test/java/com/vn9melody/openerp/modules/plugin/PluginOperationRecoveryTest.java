package com.vn9melody.openerp.modules.plugin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.modules.plugin.service.PluginDependencyResolver;
import com.vn9melody.openerp.modules.plugin.service.PluginOperationRecoveryService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-346: dependency cycle detection (TASK-305 remainder) and the abandoned-saga
 * recovery service (TASK-312 remainder) on real PostgreSQL.
 */
@QuarkusTest
public class PluginOperationRecoveryTest {

    @Inject
    PluginDependencyResolver dependencyResolver;

    @Inject
    PluginOperationRecoveryService recoveryService;

    @Inject
    PluginAdminService adminService;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    EntityManager em;

    private UUID tenantId;
    private UUID userId;
    private String suffix;

    @BeforeEach
    @Transactional
    public void setUp() {
        suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        userId = S2EngineFixtures.insertUser(em, "rec-" + suffix);
    }

    @Test
    @Transactional
    @DisplayName("TASK-305/346: A<->B cycle is rejected with PLUGIN_DEPENDENCY_CYCLE")
    public void testCycleIsRejected() {
        String keyA = "cyc-a-" + suffix;
        String keyB = "cyc-b-" + suffix;
        createCatalog(keyA);
        createCatalog(keyB);
        registerVersion(keyA, "1.0.0", keyB);
        registerVersion(keyB, "1.0.0", keyA);
        persistLedger(keyA, "1.0.0", TenantPluginStatus.ACTIVE, Instant.now());
        persistLedger(keyB, "1.0.0", TenantPluginStatus.ACTIVE, Instant.now());

        ApiException error = assertThrows(ApiException.class,
                () -> dependencyResolver.assertNoCycles(tenantId, keyA, dependencyArray(keyB)));
        assertEquals(PluginErrorCode.PLUGIN_DEPENDENCY_CYCLE, error.getCode());
    }

    @Test
    @Transactional
    @DisplayName("TASK-305/346: acyclic dependencies are accepted")
    public void testAcyclicDependenciesAreAccepted() {
        String keyA = "acy-a-" + suffix;
        String keyB = "acy-b-" + suffix;
        createCatalog(keyA);
        createCatalog(keyB);
        registerVersion(keyB, "1.0.0", null);
        persistLedger(keyB, "1.0.0", TenantPluginStatus.ACTIVE, Instant.now());

        dependencyResolver.assertNoCycles(tenantId, keyA, dependencyArray(keyB));
    }

    @Test
    @Transactional
    @DisplayName("TASK-312/346: an abandoned INSTALLING saga is closed as INSTALL_FAILED")
    public void testAbandonedSagaIsRecovered() {
        String key = "rec-" + suffix;
        createCatalog(key);
        registerVersion(key, "1.0.0", null);
        TenantPlugin ledger = persistLedger(key, "1.0.0", TenantPluginStatus.INSTALLING,
                Instant.now().minus(30, ChronoUnit.MINUTES));

        int recovered = recoveryService.recoverStale(15, Instant.now());

        assertTrue(recovered >= 1, "the stale ledger must be recovered");
        TenantPlugin reloaded = tenantPluginRepository.findByTenantAndKey(tenantId, key).orElseThrow();
        assertEquals(TenantPluginStatus.INSTALL_FAILED, reloaded.status);
        assertEquals(PluginErrorCode.PLUGIN_OPERATION_RECOVERY_ABANDONED, reloaded.lastErrorCode);
        assertNotNull(ledger.updatedAt);
    }

    @Test
    @Transactional
    @DisplayName("TASK-312/346: a recent saga is left alone")
    public void testRecentSagaIsNotRecovered() {
        String key = "fresh-" + suffix;
        createCatalog(key);
        registerVersion(key, "1.0.0", null);
        persistLedger(key, "1.0.0", TenantPluginStatus.INSTALLING, Instant.now());

        recoveryService.recoverStale(15, Instant.now());

        TenantPlugin reloaded = tenantPluginRepository.findByTenantAndKey(tenantId, key).orElseThrow();
        assertEquals(TenantPluginStatus.INSTALLING, reloaded.status);
    }

    private void createCatalog(String key) {
        if (adminService.existsByKey(key)) {
            return;
        }
        PluginRequests.RegisterCatalog catalog = new PluginRequests.RegisterCatalog();
        catalog.pluginKey = key;
        catalog.nameKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_NAME";
        catalog.descriptionKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_DESCRIPTION";
        adminService.createCatalog(catalog, userId);
    }

    private void registerVersion(String key, String version, String dependencyKey) {
        PluginRequests.RegisterVersion request = new PluginRequests.RegisterVersion();
        request.source = "DOCKER_HUB";
        request.imageRef = "open-erp/" + key;
        request.tag = version;
        request.version = version;
        request.checksum = "sha256-" + key + "-" + version;
        request.manifest = manifest(key, version, dependencyKey);
        adminService.registerVersion(key, request, userId);
    }

    private ObjectNode manifest(String key, String version, String dependencyKey) {
        ObjectNode manifest = objectMapper.createObjectNode();
        manifest.put("id", key);
        manifest.put("version", version);
        manifest.put("core_version_compatibility", ">=1.0.0 <2.0.0");
        manifest.put("migration_policy", "COMPATIBLE");
        if (dependencyKey != null) {
            ArrayNode dependencies = manifest.putArray("dependencies");
            dependencies.add(dependencyKey);
        }
        return manifest;
    }

    private ArrayNode dependencyArray(String key) {
        ArrayNode dependencies = objectMapper.createArrayNode();
        dependencies.add(key);
        return dependencies;
    }

    private TenantPlugin persistLedger(String key, String installedVersion, TenantPluginStatus status,
                                       Instant updatedAt) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(key);
        TenantPlugin ledger = new TenantPlugin();
        ledger.tenantId = tenantId;
        ledger.pluginKey = key;
        ledger.catalogId = catalog.id;
        ledger.status = status;
        ledger.installedVersion = installedVersion;
        ledger.createdAt = updatedAt;
        ledger.updatedAt = updatedAt;
        tenantPluginRepository.persist(ledger);
        return ledger;
    }
}
