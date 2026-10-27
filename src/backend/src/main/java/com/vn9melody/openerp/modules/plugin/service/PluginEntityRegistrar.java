package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
/**
 * Registers a packaged plugin's manifest entities in the shared Entity Registry
 * at install time (ADR-S05-001 A9). Container plugins cannot be scanned by the
 * core's Jandex index, so the manifest is the source of truth.
 */
@ApplicationScoped
public class PluginEntityRegistrar {

    private static final Logger LOG = Logger.getLogger(PluginEntityRegistrar.class);

    @Inject
    EntityManager entityManager;

    @Transactional
    public int register(String pluginKey, JsonNode entities) {
        if (pluginKey == null || entities == null || !entities.isArray()) {
            return 0;
        }
        int registered = 0;
        for (JsonNode entity : entities) {
            String name = entity.path("name").asText(null);
            String table = entity.path("table").asText(null);
            if (name == null || name.isBlank() || table == null || table.isBlank()) {
                continue;
            }
            JsonNode publicFields = entity.path("public_fields");
            String fieldsJson = publicFields.isArray() ? publicFields.toString() : "[]";
            String storageScope = entity.path("storage_scope").asText("TENANT");
            JsonNode relationsNode = entity.path("relations");
            String relationsJson = relationsNode.isArray() ? relationsNode.toString() : "[]";
            String schemaJson = "{\"storage_scope\":\"" + storageScope + "\",\"fields\":" + fieldsJson + "}";
            entityManager.createNativeQuery("""
                    INSERT INTO sys_entity_registry
                        (id, plugin_id, entity_name, storage_type, table_or_collection,
                         schema_definition, exported_relations)
                    VALUES (gen_random_uuid(), ?1, ?2, 'postgres', ?3,
                            CAST(?4 AS jsonb), CAST(?5 AS jsonb))
                    ON CONFLICT (plugin_id, entity_name) DO UPDATE
                    SET storage_type = EXCLUDED.storage_type,
                        table_or_collection = EXCLUDED.table_or_collection,
                        schema_definition = EXCLUDED.schema_definition,
                        exported_relations = EXCLUDED.exported_relations
                    """)
                .setParameter(1, pluginKey)
                .setParameter(2, name)
                .setParameter(3, table)
                .setParameter(4, schemaJson)
                .setParameter(5, relationsJson)
                .executeUpdate();
            registered++;
        }
        LOG.infof("Entity Registry: registered %d entities for plugin %s", registered, pluginKey);
        return registered;
    }
}
