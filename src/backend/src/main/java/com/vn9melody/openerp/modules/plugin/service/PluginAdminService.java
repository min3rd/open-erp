package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PluginDistributionType;
import com.vn9melody.openerp.core.enums.PluginMigrationPolicy;
import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.PluginRollbackStrategy;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.api.PluginResponseKey;
import com.vn9melody.openerp.modules.plugin.api.PluginSupport;
import com.vn9melody.openerp.modules.plugin.artifact.OciRegistryClient;
import com.vn9melody.openerp.modules.plugin.artifact.PluginArtifactVerifier;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginUiSlotRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Catalog + version administration for the Plugin Manager (TASK-303).
 * Lifecycle/saga operations live in PluginLifecycleService (TASK-304).
 */
@ApplicationScoped
public class PluginAdminService {

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginUiSlotRepository uiSlotRepository;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginUiSlotSyncService uiSlotSyncService;

    @Inject
    PluginGovernanceService governanceService;

    @Inject
    PluginAuditService auditService;

    @Inject
    PluginArtifactVerifier artifactVerifier;

    @Inject
    PluginCredentialService credentialService;

    @Inject
    OciRegistryClient ociRegistryClient;

    @ConfigProperty(name = "openerp.plugin.oci.resolve-digest", defaultValue = "true")
    boolean resolveOciDigest;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    EntityManager entityManager;

    @Transactional
    public PluginResponses.CatalogItem createCatalog(PluginRequests.RegisterCatalog request, UUID actorId) {
        if (request == null || request.pluginKey == null || request.pluginKey.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST, "plugin_key is required");
        }
        String key = request.pluginKey.trim().toLowerCase();
        if (!PluginSupport.isValidPluginKey(key) || PluginSupport.isReservedKey(key)) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_KEY_ALREADY_EXISTS, "Invalid or reserved plugin key");
        }
        if (catalogRepository.existsByPluginKey(key)) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_KEY_ALREADY_EXISTS, "Plugin key already exists");
        }
        PluginCatalog catalog = new PluginCatalog();
        catalog.pluginKey = key;
        catalog.nameKey = requireText(request.nameKey, "name_key");
        catalog.descriptionKey = requireText(request.descriptionKey, "description_key");
        catalog.visibility = PluginVisibility.PLATFORM;
        catalog.defaultInstall = Boolean.TRUE.equals(request.defaultInstall);
        catalog.locked = Boolean.TRUE.equals(request.locked);
        catalog.catalogStatus = PluginCatalogStatus.ACTIVE;
        catalog.entitlementPlans = toJson(request.entitlementPlans);
        catalog.createdBy = actorId;
        catalog.createdAt = Instant.now();
        catalog.updatedAt = catalog.createdAt;
        catalogRepository.persist(catalog);
        auditService.platform(actorId, PlatformAction.PLUGIN_REGISTERED, catalog.pluginKey, null, null, null);
        return toCatalogItem(catalog);
    }

    @Transactional
    public PluginResponses.CatalogItem updateCatalog(String pluginKey, PluginRequests.UpdateCatalog request,
                                                     UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        if (request.nameKey != null && !request.nameKey.isBlank()) {
            catalog.nameKey = request.nameKey.trim();
        }
        if (request.descriptionKey != null && !request.descriptionKey.isBlank()) {
            catalog.descriptionKey = request.descriptionKey.trim();
        }
        if (request.entitlementPlans != null) {
            catalog.entitlementPlans = toJson(request.entitlementPlans);
        }
        if (request.defaultInstall != null) {
            if (catalog.visibility == PluginVisibility.TENANT_PRIVATE && request.defaultInstall) {
                throw new ApiException(400, PluginErrorCode.PLUGIN_CUSTOM_NOT_ALLOWED,
                        "Tenant-private plugins cannot be installed by default");
            }
            catalog.defaultInstall = request.defaultInstall;
        }
        if (request.locked != null) {
            catalog.locked = request.locked;
        }
        catalog.updatedAt = Instant.now();
        auditService.platform(actorId, PlatformAction.PLUGIN_METADATA_UPDATED, catalog.pluginKey, null, null, null);
        return toCatalogItem(catalog);
    }

    @Transactional
    public PluginResponses.CatalogDetail getDetail(String pluginKey) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        return toCatalogDetail(catalog);
    }

    @Transactional
    public boolean existsByKey(String pluginKey) {
        return catalogRepository.existsByPluginKey(pluginKey);
    }

    public record CatalogPage(List<PluginResponses.CatalogItem> items, int page, int size, long totalItems) {}

    @Transactional
    public CatalogPage listCatalog(String keyword, PluginCatalogStatus status, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        var query = catalogRepository.search(keyword, status).page(safePage, safeSize);
        List<PluginResponses.CatalogItem> items = query.list().stream().map(this::toCatalogItem).toList();
        return new CatalogPage(items, safePage, safeSize, query.count());
    }

    public record InstallationPage(List<PluginResponses.InstallationItem> items, int page, int size,
                                   long totalItems) {}

    @Transactional
    public InstallationPage installations(String pluginKey, int page, int size) {
        requireCatalog(pluginKey);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                SELECT tp.tenant_id, t.slug, t.name, tp.status, tp.installed_version, tp.target_version,
                       tp.storage_schema, tp.last_error_code
                FROM tenant_plugins tp
                JOIN tenants t ON t.id = tp.tenant_id
                WHERE tp.plugin_key = ?1
                ORDER BY t.name ASC
                LIMIT ?2 OFFSET ?3
                """)
                .setParameter(1, pluginKey)
                .setParameter(2, safeSize)
                .setParameter(3, (long) safePage * safeSize)
                .getResultList();
        Number total = (Number) entityManager.createNativeQuery("""
                SELECT COUNT(*) FROM tenant_plugins WHERE plugin_key = ?1
                """).setParameter(1, pluginKey).getSingleResult();
        List<PluginResponses.InstallationItem> items = rows.stream().map(row -> {
            PluginResponses.InstallationItem item = new PluginResponses.InstallationItem();
            item.tenantId = String.valueOf(row[0]);
            item.tenantSlug = row[1] != null ? String.valueOf(row[1]) : null;
            item.tenantName = row[2] != null ? String.valueOf(row[2]) : null;
            item.status = row[3] != null ? String.valueOf(row[3]) : null;
            item.installedVersion = row[4] != null ? String.valueOf(row[4]) : null;
            item.targetVersion = row[5] != null ? String.valueOf(row[5]) : null;
            item.storageSchema = row[6] != null ? String.valueOf(row[6]) : null;
            item.lastErrorCode = row[7] != null ? String.valueOf(row[7]) : null;
            return item;
        }).toList();
        return new InstallationPage(items, safePage, safeSize, total == null ? 0 : total.longValue());
    }

    @Transactional
    public void deleteCatalog(String pluginKey, UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        long installs = tenantPluginRepository.count("catalogId", catalog.id);
        if (installs > 0) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_IN_USE_BY_TENANTS,
                    "Plugin is still assigned to tenants");
        }
        catalogRepository.delete(catalog);
        auditService.platform(actorId, PlatformAction.PLUGIN_CATALOG_DELETED, catalog.pluginKey, null, null, null);
    }

    @Transactional
    public PluginResponses.VersionItem registerVersion(String pluginKey, PluginRequests.RegisterVersion request,
                                                       UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        if (request == null || request.manifest == null) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST, "manifest is required");
        }
        JsonNode manifest = request.manifest;
        String manifestKey = text(manifest, "plugin_key", text(manifest, "id", null));
        if (manifestKey == null || !manifestKey.equalsIgnoreCase(catalog.pluginKey)) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                    "manifest plugin_key does not match the catalog entry");
        }
        String version = request.version != null ? request.version.trim() : text(manifest, "version", null);
        if (!PluginSupport.isValidSemver(version)) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST, "Invalid SemVer version");
        }
        if (versionRepository.findByCatalogAndVersion(catalog.id, version).isPresent()) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_VERSION_ALREADY_EXISTS, "Version already exists");
        }
        String coreCompatibility = text(manifest, "core_version_compatibility",
                text(manifest, "core_compatibility", null));
        if (coreCompatibility == null || coreCompatibility.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                    "core_version_compatibility is required");
        }
        JsonNode permissions = manifest.path("permissions");
        validatePermissions(permissions);
        JsonNode dependencies = manifest.path("dependencies");
        if (!dependencies.isMissingNode() && dependencies.isArray()) {
            validateDependencies(dependencies);
        }
        JsonNode uiManifest = manifest.path("ui_manifest");
        validateUiContributions(uiManifest);

        artifactVerifier.verifyRegistry(request.source, request.imageRef, request.registryUrl);
        artifactVerifier.verifyBundleChecksum(request.artifactRef, request.checksum);
        validateCredentialReference(request.credentialId, null);
        String resolvedDigest = resolveRegistryDigest(request);

        PluginVersion entity = new PluginVersion();
        entity.catalogId = catalog.id;
        entity.version = version;
        entity.releaseStatus = PluginReleaseStatus.DRAFT;
        entity.coreCompatibility = coreCompatibility.trim();
        entity.dependencies = dependencies.isMissingNode() ? objectMapper.createArrayNode() : dependencies;
        entity.platforms = manifest.path("platforms").isMissingNode()
                ? objectMapper.createObjectNode() : manifest.path("platforms");
        entity.permissions = permissions.isMissingNode() ? objectMapper.createArrayNode() : permissions;
        entity.entities = manifest.path("entities").isMissingNode()
                ? objectMapper.createArrayNode() : manifest.path("entities");
        entity.uiManifest = uiManifest.isMissingNode() ? objectMapper.createObjectNode() : uiManifest;
        entity.distribution = buildDistribution(request, resolvedDigest);
        entity.manifest = manifest;
        entity.migrationPolicy = PluginMigrationPolicy.fromString(text(manifest, "migration_policy", "COMPATIBLE"));
        entity.rollbackStrategy = PluginRollbackStrategy.fromString(text(manifest, "rollback_strategy", "SNAPSHOT_RESTORE"));
        entity.templateVersion = request.templateVersion != null
                ? request.templateVersion
                : text(manifest, "template_version", null);
        entity.createdBy = actorId;
        entity.createdAt = Instant.now();
        versionRepository.persist(entity);
        catalog.updatedAt = entity.createdAt;
        auditService.platform(actorId, PlatformAction.PLUGIN_VERSION_ADDED, catalog.pluginKey, null, null,
                Map.of(PluginResponseKey.VERSION.getKey(), version));
        return toVersionItem(entity);
    }

    @Transactional
    public PluginResponses.ActionResult publishVersion(String pluginKey, String version, String reason,
                                                       UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        if (catalog.catalogStatus == PluginCatalogStatus.BLOCKED) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_BLOCKED_BY_PLATFORM, "Catalog is blocked");
        }
        PluginVersion entity = requireVersion(catalog.id, version);
        if (entity.releaseStatus == PluginReleaseStatus.BLOCKED) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_BLOCKED_BY_PLATFORM,
                    "Blocked versions can only be unblocked by the platform");
        }
        entity.releaseStatus = PluginReleaseStatus.PUBLISHED;
        entity.publishedAt = Instant.now();
        entity.publishReason = reason;
        entity.blockReason = null;
        entity.blockedAt = null;
        uiSlotSyncService.syncFromManifest(catalog.pluginKey, entity.version, entity.uiManifest);
        auditService.platform(actorId, PlatformAction.PLUGIN_PUBLISHED, catalog.pluginKey, null, reason,
                Map.of(PluginResponseKey.VERSION.getKey(), version));
        return action(catalog, entity, reason);
    }

    @Transactional
    public PluginResponses.ActionResult deprecateVersion(String pluginKey, String version, String reason,
                                                         UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        PluginVersion entity = requireVersion(catalog.id, version);
        if (entity.releaseStatus != PluginReleaseStatus.PUBLISHED) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_VERSION_NOT_VERIFIED,
                    "Only published versions can be deprecated");
        }
        entity.releaseStatus = PluginReleaseStatus.DEPRECATED;
        auditService.platform(actorId, PlatformAction.PLUGIN_DEPRECATED, catalog.pluginKey, null, reason,
                Map.of(PluginResponseKey.VERSION.getKey(), version));
        return action(catalog, entity, reason);
    }

    @Transactional
    public PluginResponses.ActionResult blockVersion(String pluginKey, String version, String reason,
                                                     UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        PluginVersion entity = requireVersion(catalog.id, version);
        entity.releaseStatus = PluginReleaseStatus.BLOCKED;
        entity.blockReason = reason;
        entity.blockedAt = Instant.now();
        auditService.platform(actorId, PlatformAction.PLUGIN_BLOCKED, catalog.pluginKey, null, reason,
                Map.of(PluginResponseKey.VERSION.getKey(), version));
        return action(catalog, entity, reason);
    }

    @Transactional
    public PluginResponses.ActionResult unblockVersion(String pluginKey, String version, String reason, UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        if (catalog.catalogStatus == PluginCatalogStatus.BLOCKED) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_BLOCKED_BY_PLATFORM,
                    "Unblock the catalog before unblocking a version");
        }
        entityManager.createNativeQuery("select unblock_plugin_version(:catalogId, :version, :actor, :reason)")
                .setParameter("catalogId", catalog.id)
                .setParameter("version", version)
                .setParameter("actor", actorId)
                .setParameter("reason", reason)
                .getSingleResult();
        PluginVersion entity = requireVersion(catalog.id, version);
        auditService.platform(actorId, PlatformAction.PLUGIN_UNBLOCKED, catalog.pluginKey, null, reason,
                Map.of(PluginResponseKey.VERSION.getKey(), version));
        return action(catalog, entity, reason);
    }

    @Transactional
    public PluginResponses.ActionResult blockCatalog(String pluginKey, PluginRequests.Block request,
                                                     UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        String reason = requireText(request != null ? request.reason : null, "reason");
        boolean forceUninstall = request != null && Boolean.TRUE.equals(request.forceUninstall);
        if (forceUninstall) {
            String confirmText = request.confirmations != null ? request.confirmations.confirmText : null;
            if (confirmText == null || !confirmText.equals(catalog.pluginKey)) {
                throw new ApiException(400, PluginErrorCode.PLUGIN_BLOCK_CONFIRMATION_REQUIRED,
                        "Confirmation text must equal the plugin key");
            }
            Integer expected = request.confirmations != null ? request.confirmations.affectedTenants : null;
            if (expected != null) {
                long actual = tenantPluginRepository.countByPluginAndStatus(catalog.pluginKey,
                        TenantPluginStatus.ACTIVE);
                if (actual != expected) {
                    throw new ApiException(400, PluginErrorCode.PLUGIN_BLOCK_CONFIRMATION_REQUIRED,
                            "Affected tenant count mismatch: expected " + expected + " but found " + actual);
                }
            }
        }
        catalog.catalogStatus = PluginCatalogStatus.BLOCKED;
        catalog.blockedReason = reason;
        catalog.blockedAt = Instant.now();
        catalog.updatedAt = catalog.blockedAt;
        PluginResponses.ActionResult result = new PluginResponses.ActionResult();
        result.pluginKey = catalog.pluginKey;
        result.catalogStatus = catalog.catalogStatus.name();
        result.reason = reason;
        if (forceUninstall) {
            result.affectedTenants = governanceService.forceUninstallAll(catalog.pluginKey, reason);
        }
        auditService.platform(actorId, PlatformAction.PLUGIN_BLOCKED, catalog.pluginKey, null, reason,
                Map.of("force_uninstall", forceUninstall,
                        "affected_tenants", result.affectedTenants == null ? 0 : result.affectedTenants));
        return result;
    }

    @Transactional
    public List<PluginResponses.CatalogItem> listTenantPrivate() {
        return catalogRepository.listTenantPrivateAll().stream().map(this::toCatalogItem).toList();
    }

    @Transactional
    public PluginResponses.ActionResult unblockCatalog(String pluginKey, String reason, UUID actorId) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        String text = requireText(reason, "reason");
        entityManager.createNativeQuery("select unblock_plugin_catalog(:catalogId, :actor, :reason)")
                .setParameter("catalogId", catalog.id)
                .setParameter("actor", actorId)
                .setParameter("reason", text)
                .getSingleResult();
        catalog.catalogStatus = PluginCatalogStatus.ACTIVE;
        catalog.blockedReason = null;
        catalog.blockedAt = null;
        catalog.updatedAt = Instant.now();
        auditService.platform(actorId, PlatformAction.PLUGIN_UNBLOCKED, catalog.pluginKey, null, text, null);
        PluginResponses.ActionResult result = new PluginResponses.ActionResult();
        result.pluginKey = catalog.pluginKey;
        result.catalogStatus = catalog.catalogStatus.name();
        result.reason = text;
        return result;
    }

    @Transactional
    public PluginResponses.CatalogItem tenantCreateCatalog(UUID tenantId, UUID actorId,
                                                          PluginRequests.RegisterCatalog request) {
        if (request == null || request.pluginKey == null || request.pluginKey.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST, "plugin_key is required");
        }
        String key = request.pluginKey.trim().toLowerCase();
        if (!PluginSupport.isValidPluginKey(key) || PluginSupport.isReservedKey(key)) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_KEY_ALREADY_EXISTS, "Invalid or reserved plugin key");
        }
        if (catalogRepository.existsByPluginKey(key)) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_KEY_ALREADY_EXISTS, "Plugin key already exists");
        }
        PluginCatalog catalog = new PluginCatalog();
        catalog.pluginKey = key;
        catalog.nameKey = requireText(request.nameKey, "name_key");
        catalog.descriptionKey = requireText(request.descriptionKey, "description_key");
        catalog.visibility = PluginVisibility.TENANT_PRIVATE;
        catalog.ownerTenantId = tenantId;
        catalog.defaultInstall = false;
        catalog.locked = false;
        catalog.catalogStatus = PluginCatalogStatus.ACTIVE;
        catalog.entitlementPlans = toJson(List.of());
        catalog.createdBy = actorId;
        catalog.createdAt = Instant.now();
        catalog.updatedAt = catalog.createdAt;
        catalogRepository.persist(catalog);
        auditService.tenant(tenantId, PlatformAction.PLUGIN_TENANT_REGISTERED, catalog.pluginKey, null);
        return toCatalogItem(catalog);
    }

    @Transactional
    public PluginResponses.VersionItem tenantRegisterVersion(UUID tenantId, UUID actorId, String pluginKey,
                                                             PluginRequests.RegisterVersion request) {
        requireOwnPrivateCatalog(tenantId, pluginKey);
        validateCredentialReference(request != null ? request.credentialId : null, tenantId);
        PluginResponses.VersionItem item = registerVersion(pluginKey, request, actorId);
        auditService.tenant(tenantId, PlatformAction.PLUGIN_TENANT_VERSION_ADDED, pluginKey,
                Map.of(PluginResponseKey.VERSION.getKey(), request.version));
        return item;
    }

    private void validateCredentialReference(String credentialId, UUID tenantId) {
        if (credentialId == null || credentialId.isBlank()) {
            return;
        }
        UUID id;
        try {
            id = UUID.fromString(credentialId.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_CREDENTIAL_NOT_FOUND,
                    "credential_id is not a valid UUID");
        }
        if (tenantId == null) {
            credentialService.requireExists(id);
        } else {
            credentialService.validateForUse(id, tenantId);
        }
    }

    @Transactional
    public List<PluginResponses.VersionItem> tenantListVersions(UUID tenantId, String pluginKey) {
        PluginCatalog catalog = requireOwnPrivateCatalog(tenantId, pluginKey);
        return versionRepository.listByCatalog(catalog.id).stream().map(this::toVersionItem).toList();
    }

    @Transactional
    public PluginResponses.ActionResult tenantVersionAction(UUID tenantId, String pluginKey, String version,
                                                            String action, String reason, UUID actorId) {
        requireOwnPrivateCatalog(tenantId, pluginKey);
        String normalized = action == null ? "" : action.trim().toUpperCase();
        PluginResponses.ActionResult result = switch (normalized) {
            case "PUBLISH" -> {
                PluginResponses.ActionResult published = publishVersion(pluginKey, version, reason, actorId);
                auditService.tenant(tenantId, PlatformAction.PLUGIN_TENANT_VERSION_PUBLISHED, pluginKey,
                        Map.of(PluginResponseKey.VERSION.getKey(), version));
                yield published;
            }
            case "DEPRECATE" -> {
                PluginResponses.ActionResult deprecated = deprecateVersion(pluginKey, version, reason, actorId);
                auditService.tenant(tenantId, PlatformAction.PLUGIN_TENANT_VERSION_DEPRECATED, pluginKey,
                        Map.of(PluginResponseKey.VERSION.getKey(), version));
                yield deprecated;
            }
            default -> throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                    "Tenant may only PUBLISH or DEPRECATE versions");
        };
        return result;
    }

    @Transactional
    public void tenantDeleteVersion(UUID tenantId, String pluginKey, String version) {
        PluginCatalog catalog = requireOwnPrivateCatalog(tenantId, pluginKey);
        PluginVersion entity = versionRepository.findByCatalogAndVersion(catalog.id, version)
                .orElseThrow(() -> new ApiException(404, PluginErrorCode.PLUGIN_VERSION_IN_USE,
                        "Version not found"));
        if (versionRepository.isVersionInUse(catalog.id, version)) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_VERSION_IN_USE,
                    "Version is installed by at least one tenant");
        }
        versionRepository.delete(entity);
        auditService.tenant(tenantId, PlatformAction.PLUGIN_TENANT_VERSION_REMOVED, pluginKey,
                Map.of(PluginResponseKey.VERSION.getKey(), version));
    }

    @Transactional
    public void tenantDeleteCatalog(UUID tenantId, String pluginKey) {
        PluginCatalog catalog = requireOwnPrivateCatalog(tenantId, pluginKey);
        tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).ifPresent(ledger -> {
            if (ledger.status != TenantPluginStatus.UNINSTALLED
                    && ledger.status != TenantPluginStatus.NOT_INSTALLED) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_VERSION_IN_USE,
                        "Plugin is still installed; uninstall before deleting the catalog");
            }
            tenantPluginRepository.delete(ledger);
            tenantPluginRepository.flush();
        });
        versionRepository.delete("catalogId", catalog.id);
        catalogRepository.delete(catalog);
        auditService.tenant(tenantId, PlatformAction.PLUGIN_TENANT_CATALOG_DELETED, pluginKey, null);
    }

    private PluginCatalog requireOwnPrivateCatalog(UUID tenantId, String pluginKey) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin not found");
        }
        if (catalog.visibility != PluginVisibility.TENANT_PRIVATE || !tenantId.equals(catalog.ownerTenantId)) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_NOT_ENTITLED,
                    "Plugin is not owned by this tenant");
        }
        return catalog;
    }

    private PluginCatalog requireCatalog(String pluginKey) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin not found");
        }
        return catalog;
    }

    private PluginVersion requireVersion(UUID catalogId, String version) {
        return versionRepository.findByCatalogAndVersion(catalogId, version)
                .orElseThrow(() -> new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Version not found"));
    }

    private void validatePermissions(JsonNode permissions) {
        if (!permissions.isArray()) {
            return;
        }
        for (JsonNode permission : permissions) {
            String code = permission.isTextual() ? permission.asText() : permission.path("code").asText(null);
            if (!PluginSupport.isValidPermission(code)) {
                throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                        "Invalid permission code: " + code);
            }
        }
    }

    private void validateDependencies(JsonNode dependencies) {
        for (JsonNode dependency : dependencies) {
            String key = dependency.isTextual() ? dependency.asText() : dependency.path("key").asText(null);
            if (key == null || catalogRepository.findByPluginKey(key) == null) {
                Map<String, Object> params = new HashMap<>();
                params.put(PluginResponseKey.PLUGIN_KEY.getKey(), key);
                throw new ApiException(409, PluginErrorCode.PLUGIN_DEPENDENCY_MISSING,
                        "Dependency plugin is not registered: " + key, params);
            }
        }
    }

    private void validateUiContributions(JsonNode uiManifest) {
        JsonNode contributions = uiManifest.path("contributions");
        if (!contributions.isArray()) {
            return;
        }
        List<String> missing = new ArrayList<>();
        for (JsonNode contribution : contributions) {
            String slot = contribution.path("slot").asText(null);
            if (slot == null) {
                throw new ApiException(400, PluginErrorCode.PLUGIN_UI_SLOT_NOT_FOUND, "Contribution slot is required");
            }
            boolean exists = uiSlotRepository.findCoreSlot(slot).isPresent()
                    || uiSlotRepository.count("slotCode = ?1 and hostType = 'PLUGIN'", slot) > 0;
            if (!exists) {
                missing.add(slot);
            }
        }
        if (!missing.isEmpty()) {
            Map<String, Object> params = new HashMap<>();
            params.put(PluginResponseKey.SLOT_CODE.getKey(), missing);
            throw new ApiException(409, PluginErrorCode.PLUGIN_UI_SLOT_NOT_FOUND,
                    "Unknown UI slot(s): " + missing, params);
        }
    }

    private String resolveRegistryDigest(PluginRequests.RegisterVersion request) {
        if (!resolveOciDigest) {
            return null;
        }
        String type = request.source == null ? "" : request.source.trim().toUpperCase(Locale.ROOT);
        boolean dockerHub = "DOCKER_HUB".equals(type);
        boolean imageRegistry = "IMAGE_REGISTRY".equals(type);
        if (!dockerHub && !imageRegistry) {
            return null;
        }
        OciRegistryClient.RegistryRef ref = dockerHub
                ? OciRegistryClient.parseDockerHubRef(request.imageRef, request.tag)
                : new OciRegistryClient.RegistryRef(OciRegistryClient.hostFromRegistryUrl(request.registryUrl),
                        request.repository == null ? null : request.repository.trim(),
                        request.tag == null ? null : request.tag.trim());
        OciRegistryClient.Credential credential = null;
        PluginCredentialService.ResolvedCredential resolved = credentialService.resolve(null, ref.host());
        if (resolved != null) {
            credential = new OciRegistryClient.Credential(resolved.username(), resolved.secret());
        }
        String digest = ociRegistryClient.resolveDigest(ref, credential);
        if (request.digest != null && !request.digest.isBlank()
                && !request.digest.trim().equalsIgnoreCase(digest)) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_ARTIFACT_CHECKSUM_MISMATCH,
                    "Declared digest does not match the registry manifest digest");
        }
        return digest;
    }

    private JsonNode buildDistribution(PluginRequests.RegisterVersion request, String resolvedDigest) {
        String digest = resolvedDigest != null ? resolvedDigest : request.digest;
        PluginDistributionType type;
        try {
            type = PluginDistributionType.valueOf(request.source == null ? "" : request.source.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID, "Unknown distribution source");
        }
        ObjectNode distribution = objectMapper.createObjectNode();
        distribution.put("type", type.name());
        switch (type) {
            case DOCKER_HUB -> {
                if (request.imageRef == null || request.imageRef.isBlank()) {
                    throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST, "image_ref is required");
                }
                distribution.put("image_ref", request.imageRef.trim());
                putIfPresent(distribution, "tag", request.tag);
                putIfPresent(distribution, "digest", digest);
            }
            case IMAGE_REGISTRY -> {
                if (request.registryUrl == null || request.repository == null || request.tag == null) {
                    throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                            "registry_url, repository and tag are required");
                }
                distribution.put("registry_url", request.registryUrl.trim());
                distribution.put("repository", request.repository.trim());
                distribution.put("tag", request.tag.trim());
                putIfPresent(distribution, "digest", digest);
            }
            case JAR_BUNDLE -> {
                if (request.artifactRef == null || request.artifactRef.isBlank()
                        || request.checksum == null || request.checksum.isBlank()) {
                    throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                            "artifact_ref and checksum are required for JAR bundles");
                }
                distribution.put("artifact_ref", request.artifactRef.trim());
                distribution.put("checksum", request.checksum.trim());
            }
        }
        if (request.checksum != null && !request.checksum.isBlank()) {
            distribution.put("checksum", request.checksum.trim());
        }
        putIfPresent(distribution, "credential_id", request.credentialId);
        return distribution;
    }

    private void putIfPresent(ObjectNode node, String field, String value) {
        if (value != null && !value.isBlank()) {
            node.put(field, value.trim());
        }
    }

    private JsonNode toJson(List<String> values) {
        return values == null ? objectMapper.createArrayNode() : objectMapper.valueToTree(values);
    }

    private String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST, field + " is required");
        }
        return value.trim();
    }

    private String text(JsonNode node, String field, String fallback) {
        JsonNode value = node.path(field);
        return value.isTextual() && !value.asText().isBlank() ? value.asText() : fallback;
    }

    private PluginResponses.CatalogItem toCatalogItem(PluginCatalog catalog) {
        PluginResponses.CatalogItem item = new PluginResponses.CatalogItem();
        item.pluginKey = catalog.pluginKey;
        item.nameKey = catalog.nameKey;
        item.descriptionKey = catalog.descriptionKey;
        item.visibility = catalog.visibility.name();
        item.catalogStatus = catalog.catalogStatus.name();
        item.defaultInstall = catalog.defaultInstall;
        item.locked = catalog.locked;
        item.ownerTenantId = catalog.ownerTenantId != null ? catalog.ownerTenantId.toString() : null;
        item.createdAt = catalog.createdAt;
        item.updatedAt = catalog.updatedAt;
        versionRepository.listByCatalog(catalog.id).stream()
                .filter(v -> v.releaseStatus == PluginReleaseStatus.PUBLISHED)
                .findFirst()
                .ifPresent(v -> item.latestVersion = v.version);
        return item;
    }

    private PluginResponses.CatalogDetail toCatalogDetail(PluginCatalog catalog) {
        PluginResponses.CatalogDetail detail = new PluginResponses.CatalogDetail();
        detail.pluginKey = catalog.pluginKey;
        detail.nameKey = catalog.nameKey;
        detail.descriptionKey = catalog.descriptionKey;
        detail.visibility = catalog.visibility.name();
        detail.catalogStatus = catalog.catalogStatus.name();
        detail.defaultInstall = catalog.defaultInstall;
        detail.locked = catalog.locked;
        detail.ownerTenantId = catalog.ownerTenantId != null ? catalog.ownerTenantId.toString() : null;
        detail.blockReason = catalog.blockedReason;
        detail.blockedAt = catalog.blockedAt;
        detail.createdAt = catalog.createdAt;
        detail.updatedAt = catalog.updatedAt;
        detail.entitlementPlans = catalog.entitlementPlans == null ? List.of()
                : objectMapper.convertValue(catalog.entitlementPlans,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        detail.versions = versionRepository.listByCatalog(catalog.id).stream()
                .map(this::toVersionItem)
                .toList();
        return detail;
    }

    private PluginResponses.VersionItem toVersionItem(PluginVersion entity) {
        PluginResponses.VersionItem item = new PluginResponses.VersionItem();
        item.version = entity.version;
        item.releaseStatus = entity.releaseStatus.name();
        item.coreCompatibility = entity.coreCompatibility;
        item.migrationPolicy = entity.migrationPolicy.name();
        item.rollbackStrategy = entity.rollbackStrategy.name();
        item.blockReason = entity.blockReason;
        item.createdAt = entity.createdAt;
        item.publishedAt = entity.publishedAt;
        if (entity.distribution != null && !entity.distribution.isMissingNode()) {
            item.distributionType = text(entity.distribution, "type", null);
            item.imageRef = text(entity.distribution, "image_ref", null);
            item.digest = text(entity.distribution, "digest", null);
            item.checksum = text(entity.distribution, "checksum", null);
            item.artifactRef = text(entity.distribution, "artifact_ref", null);
        }
        return item;
    }

    private PluginResponses.ActionResult action(PluginCatalog catalog, PluginVersion version, String reason) {
        PluginResponses.ActionResult result = new PluginResponses.ActionResult();
        result.pluginKey = catalog.pluginKey;
        result.version = version.version;
        result.releaseStatus = version.releaseStatus.name();
        result.reason = reason;
        return result;
    }
}
