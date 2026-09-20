package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.modules.plugin.model.PluginUiSlot;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PluginUiSlotRepository implements PanacheRepositoryBase<PluginUiSlot, UUID> {

    public Optional<PluginUiSlot> findCoreSlot(String slotCode) {
        return find("slotCode = ?1 and hostType = 'CORE'", slotCode).firstResultOptional();
    }

    public List<PluginUiSlot> listCoreSlots() {
        return list("hostType = 'CORE' order by slotCode asc");
    }

    public List<PluginUiSlot> listByOwner(String ownerPluginKey) {
        return list("hostType = 'PLUGIN' and ownerPluginKey = ?1 order by slotCode asc, contractVersion asc",
                ownerPluginKey);
    }

    public Optional<PluginUiSlot> findPluginSlot(String ownerPluginKey, String slotCode, String contractVersion) {
        return find("hostType = 'PLUGIN' and ownerPluginKey = ?1 and slotCode = ?2 and contractVersion = ?3",
                ownerPluginKey, slotCode, contractVersion).firstResultOptional();
    }
}
