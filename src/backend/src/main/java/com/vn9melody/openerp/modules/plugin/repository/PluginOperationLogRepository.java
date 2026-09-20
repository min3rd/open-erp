package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.modules.plugin.model.PluginOperationLog;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PluginOperationLogRepository implements PanacheRepository<PluginOperationLog> {

    public List<PluginOperationLog> listByOperation(UUID operationId) {
        return list("operationId = ?1 order by id asc", operationId);
    }

    public List<PluginOperationLog> listByPlugin(String pluginKey, int limit) {
        return find("pluginKey = ?1 order by id desc", pluginKey).page(0, limit).list();
    }
}
