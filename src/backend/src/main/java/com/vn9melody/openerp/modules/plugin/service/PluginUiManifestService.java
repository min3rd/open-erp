package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PluginRenderMode;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginUiSlot;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginUiSlotRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Builds the UI Manifest (DES-03-API section 5.1, TASK-309): screens + slots +
 * contributions for the current tenant/user, filtered by ACTIVE installation,
 * catalog visibility and functional permissions. Plugin version manifests are
 * the source of truth; the slot registry supplies host metadata.
 */
@ApplicationScoped
public class PluginUiManifestService {

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginUiSlotRepository uiSlotRepository;

    @Transactional
    public PluginResponses.UiManifest build(UserSecurityContext context) {
        List<PluginResponses.UiScreen> screens = new ArrayList<>();
        Map<String, List<PluginResponses.UiContribution>> contributionsBySlot = new LinkedHashMap<>();
        for (TenantPlugin ledger : tenantPluginRepository.listActiveByTenant(context.tenantId())) {
            PluginCatalog catalog = catalogRepository.findById(ledger.catalogId);
            if (catalog == null || catalog.catalogStatus == PluginCatalogStatus.BLOCKED
                    || ledger.installedVersion == null) {
                continue;
            }
            if (catalog.visibility == PluginVisibility.TENANT_PRIVATE
                    && !context.tenantId().equals(catalog.ownerTenantId)) {
                continue;
            }
            PluginVersion version = versionRepository
                    .findByCatalogAndVersion(catalog.id, ledger.installedVersion)
                    .orElse(null);
            if (version == null || version.uiManifest == null || version.uiManifest.isMissingNode()) {
                continue;
            }
            JsonNode uiManifest = version.uiManifest;
            JsonNode screenNodes = uiManifest.path("screens");
            if (screenNodes.isArray()) {
                for (JsonNode screen : screenNodes) {
                    if (!permitted(context, screen.path("permission").asText(null))) {
                        continue;
                    }
                    PluginResponses.UiScreen item = new PluginResponses.UiScreen();
                    item.pluginKey = catalog.pluginKey;
                    item.route = screen.path("route").asText(null);
                    item.titleKey = screen.path("title_key").asText(null);
                    item.permission = screen.path("permission").asText(null);
                    item.order = screen.path("order").asInt(0);
                    item.renderMode = PluginRenderMode
                            .fromString(screen.path("render_mode").asText(null)).name();
                    screens.add(item);
                }
            }
            JsonNode contributionNodes = uiManifest.path("contributions");
            if (contributionNodes.isArray()) {
                for (JsonNode contribution : contributionNodes) {
                    String slotCode = contribution.path("slot").asText(null);
                    if (slotCode == null || !permitted(context, contribution.path("permission").asText(null))) {
                        continue;
                    }
                    PluginResponses.UiContribution item = new PluginResponses.UiContribution();
                    item.pluginKey = catalog.pluginKey;
                    item.titleKey = contribution.path("title_key").asText(null);
                    item.renderMode = PluginRenderMode
                            .fromString(contribution.path("render_mode").asText(null)).name();
                    item.entry = contribution.path("entry").asText(null);
                    item.permission = contribution.path("permission").asText(null);
                    item.order = contribution.path("order").asInt(0);
                    item.contractVersion = contribution.path("contract_version").asText(
                            version.uiManifest.path("contract_version").asText("1.0"));
                    contributionsBySlot.computeIfAbsent(slotCode, key -> new ArrayList<>()).add(item);
                }
            }
        }
        screens.sort(Comparator.comparingInt(screen -> screen.order == null ? 0 : screen.order));
        List<PluginResponses.UiSlot> slots = new ArrayList<>();
        for (Map.Entry<String, List<PluginResponses.UiContribution>> entry : contributionsBySlot.entrySet()) {
            PluginResponses.UiSlot slot = new PluginResponses.UiSlot();
            slot.slotCode = entry.getKey();
            slot.host = resolveHost(entry.getKey(), context.tenantId());
            List<PluginResponses.UiContribution> contributions = entry.getValue();
            contributions.sort(Comparator.comparingInt(item -> item.order == null ? 0 : item.order));
            slot.contributions = contributions;
            slots.add(slot);
        }
        PluginResponses.UiManifest manifest = new PluginResponses.UiManifest();
        manifest.screens = screens;
        manifest.slots = slots;
        return manifest;
    }

    private boolean permitted(UserSecurityContext context, String permission) {
        return permission == null || permission.isBlank() || context.hasPermission(permission);
    }

    private PluginResponses.UiHost resolveHost(String slotCode, UUID tenantId) {
        PluginResponses.UiHost host = new PluginResponses.UiHost();
        Optional<PluginUiSlot> coreSlot = uiSlotRepository.findCoreSlot(slotCode);
        if (coreSlot.isPresent()) {
            host.type = "CORE";
            host.contractVersion = coreSlot.get().contractVersion;
            return host;
        }
        List<PluginUiSlot> pluginSlots = uiSlotRepository.listBySlotCode(slotCode);
        if (pluginSlots.isEmpty()) {
            host.type = "CORE";
            host.contractVersion = "1.0";
            return host;
        }
        PluginUiSlot slot = pluginSlots.get(0);
        host.type = "PLUGIN";
        host.pluginKey = slot.ownerPluginKey;
        host.contractVersion = slot.contractVersion;
        tenantPluginRepository.findByTenantAndKey(tenantId, slot.ownerPluginKey)
                .ifPresent(ledger -> host.installedVersion = ledger.installedVersion);
        return host;
    }
}
