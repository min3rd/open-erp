package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PluginDistributionType;
import com.vn9melody.openerp.core.enums.PluginMigrationPolicy;
import com.vn9melody.openerp.core.enums.PluginOperationType;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.api.PluginResponseKey;
import com.vn9melody.openerp.modules.plugin.artifact.PluginImageBuilder;
import com.vn9melody.openerp.modules.plugin.datasource.TenantDatasourceService;
import com.vn9melody.openerp.modules.plugin.deployer.PluginRuntimeDeployer;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Saga orchestrator for the tenant plugin lifecycle (TASK-304, SOL-01 section 4):
 * install / enable / disable / uninstall with compensation and step logging.
 * Upgrade and rollback with snapshots land in TASK-310.
 */
@ApplicationScoped
public class PluginLifecycleService {

    private static final Logger LOG = Logger.getLogger(PluginLifecycleService.class);

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginOperationLockService lockService;

    @Inject
    PluginOperationLogService operationLogService;

    @Inject
    PluginDependencyResolver dependencyResolver;

    @Inject
    PluginPermissionSeeder permissionSeeder;

    @Inject
    PluginSnapshotService snapshotService;

    @Inject
    PluginAuditService auditService;

    @Inject
    PluginImageBuilder imageBuilder;

    @Inject
    PluginAdminService adminService;

    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "openerp.core.version", defaultValue = "1.0.0")
    String coreVersion;

    @Inject
    TenantDatasourceService datasourceService;

    @Inject
    PluginRuntimeDeployer deployer;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public PluginResponses.OperationStatus install(UUID tenantId, String pluginKey, String requestedVersion,
                                                   UUID actorId) {
        String lock = lockService.tryLock(tenantId, pluginKey);
        if (lock == null) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_OPERATION_IN_PROGRESS,
                    "Another operation is running for this plugin");
        }
        UUID operationId = UUID.randomUUID();
        List<PluginResponses.OperationStep> steps = new ArrayList<>();
        PluginRuntimeDeployer.DeploymentRef deployed = null;
        TenantPlugin ledger = null;
        boolean started = false;
        try {
            ledger = requireLedger(tenantId, pluginKey);
            if (ledger.status == TenantPluginStatus.ACTIVE || ledger.status == TenantPluginStatus.INSTALLING
                    || ledger.status == TenantPluginStatus.UPGRADING) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_ALREADY_INSTALLED, "Plugin is already installed");
            }
            PluginCatalog catalog = requireCatalog(ledger.catalogId);
            if (catalog.catalogStatus == PluginCatalogStatus.BLOCKED) {
                throw new ApiException(403, PluginErrorCode.PLUGIN_BLOCKED_BY_PLATFORM, "Catalog is blocked");
            }
            PluginVersion version = resolveInstallableVersion(catalog, requestedVersion);
            assertCoreCompatible(version);
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "PRE_FLIGHT", "OK", steps, null);
            dependencyResolver.validateDependencies(tenantId, version.dependencies);
            ledger.status = TenantPluginStatus.INSTALLING;
            ledger.operationId = operationId;
            ledger.targetVersion = version.version;
            ledger.lastErrorCode = null;
            ledger.updatedAt = Instant.now();
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "LEDGER", "OK", steps, null);
            started = true;

            TenantDatasourceService.TenantDatasource datasource =
                    datasourceService.ensureDatasource(tenantId, pluginKey);
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "PROVISION_DATASOURCE", "OK", steps, null);

            String imageRef = resolveImageRef(pluginKey, version);
            deployed = deployer.deploy(new PluginRuntimeDeployer.DeployRequest(tenantId, pluginKey, version.version,
                    imageRef, datasource.schema(), runtimeEnv(tenantId, pluginKey, version.version, datasource)));
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "DEPLOY", "OK", steps, null);

            PluginRuntimeDeployer.DeploymentHealth health = deployer.health(deployed);
            if (!health.healthy()) {
                throw new ApiException(503, PluginErrorCode.PLUGIN_SERVICE_UNHEALTHY, health.detail());
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "HEALTH", "OK", steps, null);

            permissionSeeder.seed(tenantId, version.permissions);
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "SEED_PERMISSIONS", "OK", steps, null);

            ledger.status = TenantPluginStatus.ACTIVE;
            ledger.installedVersion = version.version;
            ledger.targetVersion = null;
            ledger.storageSchema = datasource.schema();
            ledger.deployRef = toJson(deployed);
            ledger.installedAt = Instant.now();
            ledger.activatedAt = ledger.installedAt;
            ledger.operationId = null;
            ledger.updatedAt = ledger.installedAt;
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "ACTIVATE", "OK", steps, null);
            auditService.tenant(tenantId, PlatformAction.TENANT_PLUGIN_INSTALLED, pluginKey,
                    Map.of("version", version.version));
            return operation(operationId, pluginKey, PluginOperationType.INSTALL,
                    TenantPluginStatus.ACTIVE, version.version, steps);
        } catch (ApiException e) {
            if (!started) {
                throw e;
            }
            compensate(ledger, deployed, operationId, tenantId, pluginKey, steps, e);
            return operation(operationId, pluginKey, PluginOperationType.INSTALL,
                    TenantPluginStatus.INSTALL_FAILED, null, steps);
        } finally {
            lockService.release(tenantId, pluginKey, lock);
        }
    }

    @Transactional
    public PluginResponses.CatalogDetail tenantDetail(UUID tenantId, String pluginKey) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin catalog entry not found");
        }
        boolean entitled = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).isPresent();
        boolean ownPrivate = catalog.visibility == PluginVisibility.TENANT_PRIVATE
                && tenantId.equals(catalog.ownerTenantId);
        if (!entitled && !ownPrivate) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_NOT_ENTITLED,
                    "Plugin is not entitled for this tenant");
        }
        return adminService.getDetail(pluginKey);
    }

    @Transactional
    public PluginResponses.OperationStatus enable(UUID tenantId, String pluginKey, UUID actorId) {
        return simpleTransition(tenantId, pluginKey, PluginOperationType.ENABLE, TenantPluginStatus.INACTIVE, true);
    }

    @Transactional
    public PluginResponses.OperationStatus disable(UUID tenantId, String pluginKey, UUID actorId) {
        return simpleTransition(tenantId, pluginKey, PluginOperationType.DISABLE, TenantPluginStatus.ACTIVE, false);
    }

    @Transactional
    public PluginResponses.OperationStatus uninstall(UUID tenantId, String pluginKey, UUID actorId) {
        String lock = lockService.tryLock(tenantId, pluginKey);
        if (lock == null) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_OPERATION_IN_PROGRESS,
                    "Another operation is running for this plugin");
        }
        UUID operationId = UUID.randomUUID();
        List<PluginResponses.OperationStep> steps = new ArrayList<>();
        try {
            TenantPlugin ledger = requireLedger(tenantId, pluginKey);
            dependencyResolver.assertNoDependents(tenantId, pluginKey);
            log(operationId, tenantId, pluginKey, PluginOperationType.UNINSTALL, "PRE_FLIGHT", "OK", steps, null);
            ledger.status = TenantPluginStatus.UNINSTALLING;
            ledger.operationId = operationId;
            ledger.updatedAt = Instant.now();
            PluginRuntimeDeployer.DeploymentRef ref = fromJson(ledger.deployRef);
            if (ref != null) {
                deployer.undeploy(ref);
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.UNINSTALL, "UNDEPLOY", "OK", steps, null);
            ledger.deployRef = objectMapper.createObjectNode();
            ledger.status = TenantPluginStatus.UNINSTALLED;
            ledger.installedVersion = null;
            ledger.targetVersion = null;
            ledger.uninstalledAt = Instant.now();
            ledger.operationId = null;
            ledger.updatedAt = ledger.uninstalledAt;
            log(operationId, tenantId, pluginKey, PluginOperationType.UNINSTALL, "ACTIVATE", "OK", steps, null);
            auditService.tenant(tenantId, PlatformAction.TENANT_PLUGIN_UNINSTALLED, pluginKey, null);
            return operation(operationId, pluginKey, PluginOperationType.UNINSTALL,
                    TenantPluginStatus.UNINSTALLED, null, steps);
        } catch (ApiException e) {
            TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).orElse(null);
            if (ledger != null) {
                ledger.status = TenantPluginStatus.INSTALL_FAILED;
                ledger.lastErrorCode = e.getCode();
                ledger.operationId = null;
                ledger.updatedAt = Instant.now();
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.UNINSTALL, "FAILED", "FAILED", steps, e.getCode());
            throw e;
        } finally {
            lockService.release(tenantId, pluginKey, lock);
        }
    }

    public List<PluginResponses.MarketplaceItem> listMarketplace(UUID tenantId) {
        List<PluginResponses.MarketplaceItem> items = new ArrayList<>();
        for (TenantPlugin ledger : tenantPluginRepository.listByTenant(tenantId)) {
            PluginCatalog catalog = catalogRepository.findById(ledger.catalogId);
            if (catalog == null || catalog.catalogStatus == PluginCatalogStatus.BLOCKED) {
                continue;
            }
            PluginResponses.MarketplaceItem item = new PluginResponses.MarketplaceItem();
            item.pluginKey = catalog.pluginKey;
            item.nameKey = catalog.nameKey;
            item.descriptionKey = catalog.descriptionKey;
            item.status = ledger.status.name();
            item.installedVersion = ledger.installedVersion;
            item.latestVersion = latestVersion(catalog);
            item.updateAvailable = ledger.status == TenantPluginStatus.ACTIVE
                    && item.latestVersion != null && !item.latestVersion.equals(ledger.installedVersion);
            item.isCustom = catalog.visibility == com.vn9melody.openerp.core.enums.PluginVisibility.TENANT_PRIVATE;
            item.locked = catalog.locked;
            item.catalogStatus = catalog.catalogStatus.name();
            items.add(item);
        }
        return items;
    }

    private PluginResponses.OperationStatus simpleTransition(UUID tenantId, String pluginKey,
                                                             PluginOperationType type,
                                                             TenantPluginStatus expected,
                                                             boolean deployOnEnable) {
        String lock = lockService.tryLock(tenantId, pluginKey);
        if (lock == null) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_OPERATION_IN_PROGRESS,
                    "Another operation is running for this plugin");
        }
        UUID operationId = UUID.randomUUID();
        List<PluginResponses.OperationStep> steps = new ArrayList<>();
        try {
            TenantPlugin ledger = requireLedger(tenantId, pluginKey);
            if (ledger.status != expected) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_NOT_INSTALLED,
                        "Plugin state does not allow this operation");
            }
            PluginCatalog catalog = requireCatalog(ledger.catalogId);
            if (catalog.locked && !deployOnEnable) {
                throw new ApiException(403, PluginErrorCode.PLUGIN_LOCKED_DEFAULT,
                        "Default mandatory plugins cannot be disabled");
            }
            if (deployOnEnable) {
                PluginVersion version = resolveInstallableVersion(catalog, ledger.installedVersion);
                TenantDatasourceService.TenantDatasource datasource =
                        datasourceService.ensureDatasource(tenantId, pluginKey);
                PluginRuntimeDeployer.DeploymentRef ref = deployer.deploy(
                        new PluginRuntimeDeployer.DeployRequest(tenantId, pluginKey, version.version,
                                resolveImageRef(pluginKey, version), datasource.schema(),
                                runtimeEnv(tenantId, pluginKey, version.version, datasource)));
                PluginRuntimeDeployer.DeploymentHealth health = deployer.health(ref);
                if (!health.healthy()) {
                    deployer.undeploy(ref);
                    throw new ApiException(503, PluginErrorCode.PLUGIN_SERVICE_UNHEALTHY, health.detail());
                }
                ledger.deployRef = toJson(ref);
            } else {
                PluginRuntimeDeployer.DeploymentRef ref = fromJson(ledger.deployRef);
                if (ref != null) {
                    deployer.undeploy(ref);
                }
                ledger.deployRef = objectMapper.createObjectNode();
            }
            ledger.status = deployOnEnable ? TenantPluginStatus.ACTIVE : TenantPluginStatus.INACTIVE;
            ledger.operationId = null;
            ledger.updatedAt = Instant.now();
            log(operationId, tenantId, pluginKey, type, deployOnEnable ? "ACTIVATE" : "DEACTIVATE", "OK", steps, null);
            auditService.tenant(tenantId,
                    deployOnEnable ? PlatformAction.TENANT_PLUGIN_ENABLED : PlatformAction.TENANT_PLUGIN_DISABLED,
                    pluginKey, null);
            return operation(operationId, pluginKey, type, ledger.status, ledger.installedVersion, steps);
        } finally {
            lockService.release(tenantId, pluginKey, lock);
        }
    }

    @Transactional
    public PluginResponses.OperationStatus upgrade(UUID tenantId, String pluginKey, String targetVersion,
                                                   Boolean snapshotRequested, UUID actorId) {
        String lock = lockService.tryLock(tenantId, pluginKey);
        if (lock == null) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_OPERATION_IN_PROGRESS,
                    "Another operation is running for this plugin");
        }
        UUID operationId = UUID.randomUUID();
        List<PluginResponses.OperationStep> steps = new ArrayList<>();
        TenantPlugin ledger = null;
        PluginVersion previousVersion = null;
        PluginRuntimeDeployer.DeploymentRef newRef = null;
        String snapshotRef = null;
        boolean started = false;
        try {
            ledger = requireLedger(tenantId, pluginKey);
            if (ledger.status != TenantPluginStatus.ACTIVE) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_NOT_INSTALLED,
                        "Only active plugins can be upgraded");
            }
            PluginCatalog catalog = requireCatalog(ledger.catalogId);
            if (catalog.catalogStatus == PluginCatalogStatus.BLOCKED) {
                throw new ApiException(403, PluginErrorCode.PLUGIN_BLOCKED_BY_PLATFORM, "Catalog is blocked");
            }
            if (targetVersion == null || targetVersion.isBlank()) {
                throw new ApiException(400, PluginErrorCode.PLUGIN_NOT_FOUND, "target_version is required");
            }
            PluginVersion target = resolveInstallableVersion(catalog, targetVersion);
            assertCoreCompatible(target);
            previousVersion = versionRepository.findByCatalogAndVersion(catalog.id, ledger.installedVersion)
                    .orElse(null);
            if (target.version.equals(ledger.installedVersion)) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_ALREADY_INSTALLED,
                        "Plugin is already on this version");
            }
            dependencyResolver.validateDependencies(tenantId, target.dependencies);
            boolean breaking = target.migrationPolicy == PluginMigrationPolicy.BREAKING;
            if (breaking && Boolean.FALSE.equals(snapshotRequested)) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_SNAPSHOT_REQUIRED,
                        "Breaking upgrades require a schema snapshot");
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "PRE_FLIGHT", "OK", steps, null);
            ledger.status = TenantPluginStatus.UPGRADING;
            ledger.operationId = operationId;
            ledger.targetVersion = target.version;
            ledger.updatedAt = Instant.now();
            log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "LEDGER", "OK", steps, null);
            started = true;

            TenantDatasourceService.TenantDatasource datasource =
                    datasourceService.ensureDatasource(tenantId, pluginKey);
            if (breaking || Boolean.TRUE.equals(snapshotRequested)) {
                snapshotRef = snapshotService.snapshot(tenantId, pluginKey, ledger.installedVersion,
                        datasource.schema(), "pre-upgrade").ref();
                log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "SNAPSHOT", "OK", steps, null);
            }
            newRef = deployer.deploy(new PluginRuntimeDeployer.DeployRequest(tenantId, pluginKey, target.version,
                    resolveImageRef(pluginKey, target), datasource.schema(),
                    runtimeEnv(tenantId, pluginKey, target.version, datasource)));
            log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "DEPLOY", "OK", steps, null);
            PluginRuntimeDeployer.DeploymentHealth health = deployer.health(newRef);
            if (!health.healthy()) {
                throw new ApiException(503, PluginErrorCode.PLUGIN_SERVICE_UNHEALTHY, health.detail());
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "HEALTH", "OK", steps, null);

            ledger.status = TenantPluginStatus.ACTIVE;
            ledger.installedVersion = target.version;
            ledger.targetVersion = null;
            ledger.storageSchema = datasource.schema();
            ledger.deployRef = toJsonWithSnapshot(newRef, snapshotRef);
            ledger.activatedAt = Instant.now();
            ledger.operationId = null;
            ledger.lastErrorCode = null;
            ledger.updatedAt = ledger.activatedAt;
            log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "ACTIVATE", "OK", steps, null);
            auditService.tenant(tenantId, PlatformAction.TENANT_PLUGIN_UPGRADED, pluginKey,
                    Map.of("to_version", target.version));
            return operation(operationId, pluginKey, PluginOperationType.UPGRADE,
                    TenantPluginStatus.ACTIVE, target.version, steps);
        } catch (ApiException e) {
            if (!started) {
                throw e;
            }
            if (newRef != null) {
                try {
                    deployer.undeploy(newRef);
                } catch (RuntimeException cleanupError) {
                    LOG.warnf("Upgrade compensation undeploy failed for %s/%s: %s", tenantId, pluginKey,
                            cleanupError.getMessage());
                }
            }
            boolean restored = snapshotRef == null;
            if (snapshotRef != null) {
                try {
                    snapshotService.restore(snapshotRef);
                    restored = true;
                    log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "RESTORE_SNAPSHOT", "OK", steps, null);
                } catch (ApiException restoreError) {
                    log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "RESTORE_SNAPSHOT", "FAILED",
                            steps, restoreError.getCode());
                }
            }
            boolean rolledBack = false;
            if (ledger != null && previousVersion != null && restored) {
                try {
                    TenantDatasourceService.TenantDatasource datasource =
                            datasourceService.ensureDatasource(tenantId, pluginKey);
                    PluginRuntimeDeployer.DeploymentRef oldRef = deployer.deploy(
                            new PluginRuntimeDeployer.DeployRequest(tenantId, pluginKey, previousVersion.version,
                                    resolveImageRef(pluginKey, previousVersion), datasource.schema(),
                                    runtimeEnv(tenantId, pluginKey, previousVersion.version, datasource)));
                    PluginRuntimeDeployer.DeploymentHealth oldHealth = deployer.health(oldRef);
                    if (!oldHealth.healthy()) {
                        throw new ApiException(503, PluginErrorCode.PLUGIN_SERVICE_UNHEALTHY, oldHealth.detail());
                    }
                    ledger.status = TenantPluginStatus.ACTIVE;
                    ledger.installedVersion = previousVersion.version;
                    ledger.targetVersion = null;
                    ledger.deployRef = toJsonWithSnapshot(oldRef, null);
                    ledger.operationId = null;
                    ledger.lastErrorCode = e.getCode();
                    ledger.lastErrorParams = objectMapper.valueToTree(e.getParams());
                    ledger.updatedAt = Instant.now();
                    rolledBack = true;
                    log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "ROLLBACK", "OK", steps, null);
                } catch (RuntimeException rollbackError) {
                    LOG.warnf("Upgrade rollback failed for %s/%s: %s", tenantId, pluginKey, rollbackError.getMessage());
                }
            }
            if (ledger != null && !rolledBack) {
                ledger.status = TenantPluginStatus.ROLLBACK_FAILED;
                ledger.operationId = null;
                ledger.lastErrorCode = e.getCode();
                ledger.lastErrorParams = objectMapper.valueToTree(e.getParams());
                ledger.updatedAt = Instant.now();
                log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "ROLLBACK", "FAILED", steps, e.getCode());
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.UPGRADE, "FAILED", "FAILED", steps, e.getCode());
            return operation(operationId, pluginKey, PluginOperationType.UPGRADE,
                    ledger != null ? ledger.status : TenantPluginStatus.ROLLBACK_FAILED,
                    rolledBack && previousVersion != null ? previousVersion.version : null, steps);
        } finally {
            lockService.release(tenantId, pluginKey, lock);
        }
    }

    @Transactional
    public PluginResponses.OperationStatus rollback(UUID tenantId, String pluginKey, String targetVersion,
                                                    Boolean restoreSnapshot, String reason, UUID actorId) {
        String lock = lockService.tryLock(tenantId, pluginKey);
        if (lock == null) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_OPERATION_IN_PROGRESS,
                    "Another operation is running for this plugin");
        }
        UUID operationId = UUID.randomUUID();
        List<PluginResponses.OperationStep> steps = new ArrayList<>();
        TenantPlugin ledger = null;
        try {
            ledger = requireLedger(tenantId, pluginKey);
            if (ledger.status != TenantPluginStatus.ACTIVE) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_NOT_INSTALLED, "Only active plugins can roll back");
            }
            PluginCatalog catalog = requireCatalog(ledger.catalogId);
            PluginVersion target = resolveInstallableVersion(catalog, targetVersion);
            assertCoreCompatible(target);
            PluginVersion current = versionRepository.findByCatalogAndVersion(catalog.id, ledger.installedVersion)
                    .orElse(null);
            boolean breaking = current != null && current.migrationPolicy == PluginMigrationPolicy.BREAKING;
            String snapshotRef = readSnapshotRef(ledger);
            if (breaking && !Boolean.TRUE.equals(restoreSnapshot)) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_SNAPSHOT_REQUIRED,
                        "Rolling back a breaking upgrade requires restoring the snapshot");
            }
            if (breaking && snapshotRef == null) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_SNAPSHOT_MISSING, "No snapshot is available");
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.ROLLBACK, "PRE_FLIGHT", "OK", steps, null);
            if (snapshotRef != null) {
                TenantDatasourceService.TenantDatasource datasource =
                        datasourceService.ensureDatasource(tenantId, pluginKey);
                snapshotService.snapshot(tenantId, pluginKey, ledger.installedVersion, datasource.schema(),
                        "post-upgrade");
                log(operationId, tenantId, pluginKey, PluginOperationType.ROLLBACK, "PRESERVATION_SNAPSHOT", "OK",
                        steps, null);
            }
            PluginRuntimeDeployer.DeploymentRef currentRef = fromJson(ledger.deployRef);
            if (currentRef != null) {
                deployer.undeploy(currentRef);
                log(operationId, tenantId, pluginKey, PluginOperationType.ROLLBACK, "QUIESCE", "OK", steps, null);
            }
            if (snapshotRef != null) {
                snapshotService.restore(snapshotRef);
                log(operationId, tenantId, pluginKey, PluginOperationType.ROLLBACK, "RESTORE_SNAPSHOT", "OK", steps, null);
            }
            TenantDatasourceService.TenantDatasource datasource =
                    datasourceService.ensureDatasource(tenantId, pluginKey);
            PluginRuntimeDeployer.DeploymentRef ref = deployer.deploy(
                    new PluginRuntimeDeployer.DeployRequest(tenantId, pluginKey, target.version,
                    resolveImageRef(pluginKey, target), datasource.schema(),
                            runtimeEnv(tenantId, pluginKey, target.version, datasource)));
            PluginRuntimeDeployer.DeploymentHealth health = deployer.health(ref);
            if (!health.healthy()) {
                deployer.undeploy(ref);
                throw new ApiException(503, PluginErrorCode.PLUGIN_SERVICE_UNHEALTHY, health.detail());
            }
            ledger.status = TenantPluginStatus.ACTIVE;
            ledger.installedVersion = target.version;
            ledger.targetVersion = null;
            ledger.deployRef = toJsonWithSnapshot(ref, null);
            ledger.operationId = null;
            ledger.lastErrorCode = null;
            ledger.updatedAt = Instant.now();
            log(operationId, tenantId, pluginKey, PluginOperationType.ROLLBACK, "ACTIVATE", "OK", steps, null);
            auditService.tenant(tenantId, PlatformAction.TENANT_PLUGIN_ROLLED_BACK, pluginKey,
                    Map.of("target_version", target.version));
            return operation(operationId, pluginKey, PluginOperationType.ROLLBACK,
                    TenantPluginStatus.ACTIVE, target.version, steps);
        } catch (ApiException e) {
            if (ledger != null) {
                ledger.status = TenantPluginStatus.ROLLBACK_FAILED;
                ledger.operationId = null;
                ledger.lastErrorCode = e.getCode();
                ledger.lastErrorParams = objectMapper.valueToTree(e.getParams());
                ledger.updatedAt = Instant.now();
            }
            log(operationId, tenantId, pluginKey, PluginOperationType.ROLLBACK, "FAILED", "FAILED", steps, e.getCode());
            return operation(operationId, pluginKey, PluginOperationType.ROLLBACK,
                    TenantPluginStatus.ROLLBACK_FAILED, null, steps);
        } finally {
            lockService.release(tenantId, pluginKey, lock);
        }
    }

    private void assertCoreCompatible(PluginVersion version) {
        if (version.coreCompatibility != null && !version.coreCompatibility.isBlank()
                && !PluginSemver.satisfies(coreVersion, version.coreCompatibility)) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_CORE_VERSION_INCOMPATIBLE,
                    "Plugin is not compatible with the current core version");
        }
    }

    private String readSnapshotRef(TenantPlugin ledger) {
        JsonNode node = ledger.deployRef;
        if (node == null || node.isMissingNode()) {
            return null;
        }
        String ref = node.path("snapshot_ref").asText(null);
        return ref == null || ref.isBlank() ? null : ref;
    }

    private JsonNode toJsonWithSnapshot(PluginRuntimeDeployer.DeploymentRef ref, String snapshotRef) {
        ObjectNode node = (ObjectNode) toJson(ref);
        if (snapshotRef != null) {
            node.put("snapshot_ref", snapshotRef);
        }
        return node;
    }

    private void compensate(TenantPlugin ledger, PluginRuntimeDeployer.DeploymentRef deployed, UUID operationId,
                            UUID tenantId, String pluginKey, List<PluginResponses.OperationStep> steps,
                            ApiException error) {
        try {
            if (deployed != null) {
                deployer.undeploy(deployed);
            }
        } catch (RuntimeException cleanupError) {
            LOG.warnf("Plugin compensation undeploy failed for %s/%s: %s", tenantId, pluginKey,
                    cleanupError.getMessage());
        }
        if (ledger != null) {
            ledger.status = TenantPluginStatus.INSTALL_FAILED;
            ledger.lastErrorCode = error.getCode();
            ledger.lastErrorParams = objectMapper.valueToTree(error.getParams());
            ledger.operationId = null;
            ledger.updatedAt = Instant.now();
        }
        log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "FAILED", "FAILED", steps, error.getCode());
    }

    private TenantPlugin requireLedger(UUID tenantId, String pluginKey) {
        return tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey)
                .orElseThrow(() -> new ApiException(403, PluginErrorCode.PLUGIN_NOT_ENTITLED,
                        "Plugin is not entitled for this tenant"));
    }

    private PluginCatalog requireCatalog(UUID catalogId) {
        PluginCatalog catalog = catalogRepository.findById(catalogId);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin catalog entry not found");
        }
        return catalog;
    }

    private PluginVersion resolveInstallableVersion(PluginCatalog catalog, String requestedVersion) {
        List<PluginVersion> installable = versionRepository.listInstallable(catalog.id);
        if (installable.isEmpty()) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_NOT_FOUND, "No installable version available");
        }
        if (requestedVersion != null && !requestedVersion.isBlank()) {
            return installable.stream()
                    .filter(v -> v.version.equals(requestedVersion))
                    .findFirst()
                    .orElseThrow(() -> new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND,
                            "Requested version is not installable"));
        }
        return installable.get(0);
    }

    private String latestVersion(PluginCatalog catalog) {
        List<PluginVersion> installable = versionRepository.listInstallable(catalog.id);
        return installable.isEmpty() ? null : installable.get(0).version;
    }

    private String resolveImageRef(String pluginKey, PluginVersion version) {
        JsonNode distribution = version.distribution;
        if (distribution == null || distribution.isMissingNode()) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED, "Version has no distribution metadata");
        }
        String type = distribution.path("type").asText("");
        try {
            return switch (PluginDistributionType.valueOf(type)) {
                case DOCKER_HUB -> {
                    String image = distribution.path("image_ref").asText();
                    String tag = distribution.path("tag").asText(null);
                    yield tag == null || tag.isBlank() ? image : image + ":" + tag;
                }
                case IMAGE_REGISTRY -> distribution.path("registry_url").asText()
                        + "/" + distribution.path("repository").asText()
                        + ":" + distribution.path("tag").asText();
                case JAR_BUNDLE -> resolveBundleImage(pluginKey, version, distribution);
            };
        } catch (IllegalArgumentException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED, "Unknown distribution type");
        }
    }

    private String resolveBundleImage(String pluginKey, PluginVersion version, JsonNode distribution) {
        String cached = distribution.path("image_ref").asText("");
        if (!cached.isBlank()) {
            return cached;
        }
        String artifactRef = distribution.path("artifact_ref").asText("");
        String imageRef = imageBuilder.build(pluginKey, version.version, artifactRef);
        if (distribution instanceof ObjectNode node) {
            node.put("image_ref", imageRef);
            node.put("image_builder", "platform");
        }
        return imageRef;
    }

    private Map<String, String> runtimeEnv(UUID tenantId, String pluginKey, String version,
                                           TenantDatasourceService.TenantDatasource datasource) {
        Map<String, String> env = new HashMap<>();
        env.put("TENANT_ID", tenantId.toString());
        env.put("PLUGIN_KEY", pluginKey);
        env.put("PLUGIN_VERSION", version);
        env.put("DB_URL", datasource.jdbcUrl());
        env.put("DB_SCHEMA", datasource.schema());
        env.put("DB_USER", datasource.role());
        env.put("DB_PASSWORD", datasource.password());
        return env;
    }

    private JsonNode toJson(PluginRuntimeDeployer.DeploymentRef ref) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("runtime", ref.runtime());
        node.put("deployment", ref.deployment());
        node.put("service", ref.service());
        node.put("healthy", ref.healthy());
        return node;
    }

    private PluginRuntimeDeployer.DeploymentRef fromJson(JsonNode node) {
        if (node == null || node.isMissingNode() || node.path("deployment").asText("").isBlank()) {
            return null;
        }
        return new PluginRuntimeDeployer.DeploymentRef(
                node.path("runtime").asText("docker"),
                node.path("deployment").asText(),
                node.path("service").asText(),
                node.path("healthy").asBoolean(false));
    }

    private PluginResponses.OperationStatus operation(UUID operationId, String pluginKey, PluginOperationType type,
                                                      TenantPluginStatus status, String targetVersion,
                                                      List<PluginResponses.OperationStep> steps) {
        PluginResponses.OperationStatus result = new PluginResponses.OperationStatus();
        result.operationId = operationId.toString();
        result.pluginKey = pluginKey;
        result.operation = type.name();
        result.status = status.name();
        result.targetVersion = targetVersion;
        result.steps = steps;
        return result;
    }

    private void log(UUID operationId, UUID tenantId, String pluginKey, PluginOperationType type,
                     String step, String result, List<PluginResponses.OperationStep> steps, String errorCode) {
        PluginResponses.OperationStep stepResult = new PluginResponses.OperationStep();
        stepResult.step = step;
        stepResult.result = result;
        stepResult.errorCode = errorCode;
        steps.add(stepResult);
        Map<String, Object> detail = new HashMap<>();
        detail.put(PluginResponseKey.PLUGIN_KEY.getKey(), pluginKey);
        if (errorCode != null) {
            detail.put("error_code", errorCode);
        }
        operationLogService.log(operationId, tenantId, pluginKey, type, step, result, detail);
    }
}
