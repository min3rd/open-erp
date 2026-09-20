package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.enums.PluginOperationType;
import com.vn9melody.openerp.modules.plugin.model.PluginOperationLog;
import com.vn9melody.openerp.modules.plugin.repository.PluginOperationLogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Append-only saga trail writer (TASK-312). One row per step keeps diagnostics
 * and idempotent recovery possible.
 */
@ApplicationScoped
public class PluginOperationLogService {

    @Inject
    PluginOperationLogRepository repository;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public void log(UUID operationId, UUID tenantId, String pluginKey, PluginOperationType operation,
                    String step, String result, Map<String, Object> detail) {
        PluginOperationLog entry = new PluginOperationLog();
        entry.operationId = operationId;
        entry.tenantId = tenantId;
        entry.pluginKey = pluginKey;
        entry.operation = operation.name();
        entry.step = step;
        entry.result = result;
        entry.detail = objectMapper.valueToTree(detail == null ? Map.of() : detail);
        entry.createdAt = Instant.now();
        repository.persist(entry);
    }
}
