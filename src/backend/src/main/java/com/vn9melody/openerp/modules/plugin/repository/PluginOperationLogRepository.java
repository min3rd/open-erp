package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.modules.plugin.model.PluginOperationLog;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PluginOperationLogRepository implements PanacheRepositoryBase<PluginOperationLog, Long> {

    public List<PluginOperationLog> listByOperation(UUID operationId) {
        return list("operationId = ?1 order by id asc", operationId);
    }
}
