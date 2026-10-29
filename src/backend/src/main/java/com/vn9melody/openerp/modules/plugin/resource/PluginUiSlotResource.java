package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ListData;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginUiSlot;
import com.vn9melody.openerp.modules.plugin.repository.PluginUiSlotRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Slot registry lookup used by CLI validation (`validate --core-url`). */
@Path("/api/v1/plugins/ui-slots")
@Produces(MediaType.APPLICATION_JSON)
public class PluginUiSlotResource {

    @Inject
    PluginUiSlotRepository repository;

    @GET
    @RequirePermission("core:plugin:read")
    public ApiResponse<ListData<PluginResponses.UiSlotDefinition>> list(
            @QueryParam("slot") String slot,
            @QueryParam("owner") String owner) {
        List<PluginUiSlot> slots;
        if (slot != null && !slot.isBlank()) {
            Map<String, PluginUiSlot> unique = new LinkedHashMap<>();
            repository.findCoreSlot(slot).ifPresent(item -> unique.put(item.slotCode + ":" + item.contractVersion, item));
            for (PluginUiSlot item : repository.listBySlotCode(slot)) {
                unique.put(item.slotCode + ":" + item.contractVersion, item);
            }
            slots = new ArrayList<>(unique.values());
        } else if (owner != null && !owner.isBlank()) {
            slots = repository.listByOwner(owner);
        } else {
            slots = repository.listAll();
        }
        List<PluginResponses.UiSlotDefinition> items = slots.stream().map(this::toDto).toList();
        return ApiResponse.successList("PLUGIN_UI_SLOTS_SUCCESS", "UI slots retrieved.", items);
    }

    private PluginResponses.UiSlotDefinition toDto(PluginUiSlot slot) {
        PluginResponses.UiSlotDefinition dto = new PluginResponses.UiSlotDefinition();
        dto.slotCode = slot.slotCode;
        dto.hostType = slot.hostType;
        dto.ownerPluginKey = slot.ownerPluginKey;
        dto.titleKey = slot.titleKey;
        dto.contractVersion = slot.contractVersion;
        dto.allowedRenderModes = slot.allowedRenderModes;
        dto.constraints = slot.constraints;
        dto.status = slot.status;
        return dto;
    }
}
