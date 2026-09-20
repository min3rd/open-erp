package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PluginDistributionType;
import com.vn9melody.openerp.core.enums.PluginOperationType;
import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.api.PluginResponseKey;
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
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "PRE_FLIGHT", "OK", steps, null);
            dependencyResolver.validateDependencies(tenantId, version.dependencies);
            ledger.status = TenantPluginStatus.INSTALLING;
            ledger.operationId = operationId;
            ledger.targetVersion = version.version;
            ledger.lastErrorCode = null;
            ledger.updatedAt = Instant.now();
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "LEDGER", "OK", steps, null);

            TenantDatasourceService.TenantDatasource datasource =
                    datasourceService.ensureDatasource(tenantId, pluginKey);
            log(operationId, tenantId, pluginKey, PluginOperationType.INSTALL, "PROVISION_DATASOURCE", "OK", steps, null);

            String imageRef = resolveImageRef(version);
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
            return operation(operationId, pluginKey, PluginOperationType.INSTALL,
                    TenantPluginStatus.ACTIVE, version.version, steps);
        } catch (ApiException e) {
            compensate(ledger, deployed, operationId, tenantId, pluginKey, steps, e);
            return operation(operationId, pluginKey, PluginOperationType.INSTALL,
                    TenantPluginStatus.INSTALL_FAILED, null, steps);
        } finally {
            lockService.release(tenantId, pluginKey, lock);
        }
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
                                resolveImageRef(version), datasource.schema(),
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
            return operation(operationId, pluginKey, type, ledger.status, ledger.installedVersion, steps);
        } finally {
            lockService.release(tenantId, pluginKey, lock);
        }
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

    private String resolveImageRef(PluginVersion version) {
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
                case JAR_BUNDLE -> throw new ApiException(501, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                        "Bundle image build is implemented in TASK-334");
            };
        } catch (IllegalArgumentException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED, "Unknown distribution type");
        }
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
