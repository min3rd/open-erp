package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PluginDistributionType;
import com.vn9melody.openerp.core.enums.PluginMigrationPolicy;
import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.core.enums.PluginRollbackStrategy;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.api.PluginResponseKey;
import com.vn9melody.openerp.modules.plugin.api.PluginSupport;
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
import java.util.Map;
import java.util.UUID;

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
        return toCatalogItem(catalog);
    }

    @Transactional
    public PluginResponses.CatalogItem updateCatalog(String pluginKey, PluginRequests.UpdateCatalog request) {
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
        return toCatalogItem(catalog);
    }

    @Transactional
    public PluginResponses.CatalogDetail getDetail(String pluginKey) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        return toCatalogDetail(catalog);
    }

    @Transactional
    public void deleteCatalog(String pluginKey) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        long installs = tenantPluginRepository.count("catalogId", catalog.id);
        if (installs > 0) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_IN_USE_BY_TENANTS,
                    "Plugin is still assigned to tenants");
        }
        catalogRepository.delete(catalog);
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
        entity.distribution = buildDistribution(request);
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
        return toVersionItem(entity);
    }

    @Transactional
    public PluginResponses.ActionResult publishVersion(String pluginKey, String version, String reason) {
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
        return action(catalog, entity, reason);
    }

    @Transactional
    public PluginResponses.ActionResult deprecateVersion(String pluginKey, String version, String reason) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        PluginVersion entity = requireVersion(catalog.id, version);
        if (entity.releaseStatus != PluginReleaseStatus.PUBLISHED) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_VERSION_NOT_VERIFIED,
                    "Only published versions can be deprecated");
        }
        entity.releaseStatus = PluginReleaseStatus.DEPRECATED;
        return action(catalog, entity, reason);
    }

    @Transactional
    public PluginResponses.ActionResult blockVersion(String pluginKey, String version, String reason) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        PluginVersion entity = requireVersion(catalog.id, version);
        entity.releaseStatus = PluginReleaseStatus.BLOCKED;
        entity.blockReason = reason;
        entity.blockedAt = Instant.now();
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
        return action(catalog, entity, reason);
    }

    @Transactional
    public PluginResponses.ActionResult blockCatalog(String pluginKey, PluginRequests.Block request) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        String reason = requireText(request != null ? request.reason : null, "reason");
        boolean forceUninstall = request != null && Boolean.TRUE.equals(request.forceUninstall);
        if (forceUninstall) {
            String confirmText = request.confirmations != null ? request.confirmations.confirmText : null;
            if (confirmText == null || !confirmText.equals(catalog.pluginKey)) {
                throw new ApiException(400, PluginErrorCode.PLUGIN_BLOCK_CONFIRMATION_REQUIRED,
                        "Confirmation text must equal the plugin key");
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
        return result;
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
        PluginResponses.ActionResult result = new PluginResponses.ActionResult();
        result.pluginKey = catalog.pluginKey;
        result.catalogStatus = catalog.catalogStatus.name();
        result.reason = text;
        return result;
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

    private JsonNode buildDistribution(PluginRequests.RegisterVersion request) {
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
                putIfPresent(distribution, "digest", request.digest);
            }
            case IMAGE_REGISTRY -> {
                if (request.registryUrl == null || request.repository == null || request.tag == null) {
                    throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                            "registry_url, repository and tag are required");
                }
                distribution.put("registry_url", request.registryUrl.trim());
                distribution.put("repository", request.repository.trim());
                distribution.put("tag", request.tag.trim());
                putIfPresent(distribution, "digest", request.digest);
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
