package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.modules.plugin.model.PluginUiSlot;
import com.vn9melody.openerp.modules.plugin.repository.PluginUiSlotRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Syncs plugin-hosted UI slots from a version manifest on publish (TASK-309 /
 * BUG-88). Slots no longer declared by the new version are marked DEPRECATED;
 * the version manifest remains the source of truth at runtime.
 */
@ApplicationScoped
public class PluginUiSlotSyncService {

    @Inject
    PluginUiSlotRepository repository;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public void syncFromManifest(String pluginKey, String version, JsonNode uiManifest) {
        Set<String> declared = new HashSet<>();
        JsonNode slots = uiManifest == null ? null : uiManifest.path("slots");
        if (slots != null && slots.isArray()) {
            for (JsonNode slot : slots) {
                String code = slot.path("slot_code").asText(slot.path("code").asText(null));
                if (code == null || code.isBlank()) {
                    continue;
                }
                String contractVersion = slot.path("contract_version").asText("1.0");
                declared.add(declarationKey(code, contractVersion));
                PluginUiSlot entity = repository.findPluginSlot(pluginKey, code, contractVersion)
                        .orElseGet(PluginUiSlot::new);
                boolean creating = entity.id == null;
                entity.slotCode = code;
                entity.hostType = "PLUGIN";
                entity.ownerPluginKey = pluginKey;
                entity.declaredInVersion = version;
                entity.titleKey = slot.path("title_key").asText(defaultTitleKey(pluginKey, code));
                entity.contractVersion = contractVersion;
                entity.allowedRenderModes = slot.path("allowed_render_modes").isMissingNode()
                        ? objectMapper.createArrayNode()
                        : slot.path("allowed_render_modes");
                entity.constraints = slot.path("constraints").isMissingNode()
                        ? objectMapper.createObjectNode()
                        : slot.path("constraints");
                entity.status = "ACTIVE";
                entity.updatedAt = Instant.now();
                if (entity.createdAt == null) {
                    entity.createdAt = entity.updatedAt;
                }
                if (creating) {
                    repository.persist(entity);
                }
            }
        }
        for (PluginUiSlot existing : repository.listByOwner(pluginKey)) {
            if (!declared.contains(declarationKey(existing.slotCode, existing.contractVersion))
                    && "ACTIVE".equals(existing.status)) {
                existing.status = "DEPRECATED";
                existing.updatedAt = Instant.now();
            }
        }
    }

    private String declarationKey(String slotCode, String contractVersion) {
        return slotCode + "@" + contractVersion;
    }

    private String defaultTitleKey(String pluginKey, String slotCode) {
        String normalized = (pluginKey + "_" + slotCode).toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "_");
        return "PLUGIN_SLOT_" + normalized;
    }
}
