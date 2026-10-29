package com.vn9melody.openerp.modules.plugin.data;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Parsed, validated subset of a published plugin manifest that core needs to
 * compile queries: entities, their public fields, relations and query
 * descriptors. Business logic stays in the plugin.
 *
 * <p>Supports both legacy entity-level {@code public_fields}/{@code relations}
 * and manifest 2.0 {@code fields[]}/{@code relations[]} (Sprint 06).</p>
 */
public record PluginManifest(
        String pluginKey,
        String version,
        Map<String, Entity> entities,
        Map<String, PluginQueryDescriptor> queries) {

    public record Entity(String name, String table, Set<String> fields,
                         Map<String, Relation> relations, boolean tenantScoped) {}

    public record Relation(String name, String targetPlugin, String targetEntity,
                           String type, String localField, String targetField) {}

    public PluginQueryDescriptor requireQuery(String queryId) {
        PluginQueryDescriptor query = queries.get(queryId);
        if (query == null) {
            throw new PluginDataException(PluginDataException.Code.QUERY_NOT_FOUND,
                    "PLUGIN_DATA_QUERY_NOT_ALLOWED");
        }
        return query;
    }

    public Entity requireEntity(String name) {
        Entity entity = entities.get(name);
        if (entity == null) {
            throw new PluginDataException(PluginDataException.Code.QUERY_NOT_FOUND,
                    "PLUGIN_DATA_ENTITY_NOT_ALLOWED");
        }
        return entity;
    }

    public static PluginManifest parse(String pluginKey, String version, JsonNode manifest) {
        if (manifest == null || !manifest.isObject()) {
            throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                    "PLUGIN_DATA_MANIFEST_INVALID");
        }
        Map<String, MutableEntity> mutableEntities = new LinkedHashMap<>();
        for (JsonNode node : manifest.path("entities")) {
            String name = node.path("name").asText("");
            String table = node.path("table").asText("");
            if (name.isBlank() || table.isBlank()) {
                continue;
            }
            Set<String> fields = new LinkedHashSet<>();
            // System columns are present on every plugin table; manifest 2.0
            // only declares business fields.
            fields.add("id");
            fields.add("created_at");
            node.path("public_fields").forEach(field -> {
                if (field.isTextual()) {
                    fields.add(field.asText());
                }
            });
            for (JsonNode fieldNode : node.path("fields")) {
                String fieldName = fieldNode.path("name").asText("");
                if (!fieldName.isBlank()) {
                    fields.add(fieldName);
                }
            }
            boolean tenantScoped = !"SYSTEM".equalsIgnoreCase(node.path("storage_scope").asText("TENANT"));
            MutableEntity entity = new MutableEntity(name, table, fields, tenantScoped);
            for (JsonNode relationNode : node.path("relations")) {
                Relation relation = relation(pluginKey, relationNode);
                if (relation != null) {
                    entity.relations.put(relation.name(), relation);
                }
            }
            mutableEntities.put(name, entity);
        }

        for (JsonNode relationNode : manifest.path("relations")) {
            String owner = relationNode.path("owner_entity").asText("");
            MutableEntity entity = mutableEntities.get(owner);
            if (entity == null) {
                continue;
            }
            Relation relation = relation(pluginKey, relationNode);
            if (relation != null) {
                entity.relations.put(relation.name(), relation);
            }
        }

        Map<String, Entity> entities = new LinkedHashMap<>();
        for (MutableEntity entity : mutableEntities.values()) {
            entities.put(entity.name, new Entity(entity.name, entity.table,
                    Set.copyOf(entity.fields), Map.copyOf(entity.relations), entity.tenantScoped));
        }
        Map<String, PluginQueryDescriptor> queries = new LinkedHashMap<>();
        for (JsonNode queryNode : manifest.path("queries")) {
            PluginQueryDescriptor query = PluginQueryDescriptor.parse(queryNode);
            queries.put(query.id(), query);
        }
        return new PluginManifest(pluginKey, version, Map.copyOf(entities), Map.copyOf(queries));
    }

    private static Relation relation(String pluginKey, JsonNode node) {
        String relationName = node.path("name").asText("");
        String target = node.path("target").asText("");
        String targetEntity = node.path("target_entity").asText("");
        String targetPlugin = node.path("target_plugin").asText("");
        if (relationName.isBlank()) {
            return null;
        }
        if (!target.isBlank()) {
            if (target.startsWith("self.")) {
                targetPlugin = pluginKey;
                targetEntity = target.substring("self.".length());
            } else if (target.startsWith("core.")) {
                targetPlugin = "core";
                targetEntity = target.substring("core.".length());
            } else if (target.startsWith("plugin:")) {
                String value = target.substring("plugin:".length());
                int dot = value.indexOf('.');
                targetPlugin = dot > 0 ? value.substring(0, dot) : value;
                targetEntity = dot > 0 ? value.substring(dot + 1) : "";
            }
        }
        if (targetEntity.isBlank()) {
            return null;
        }
        String localField = node.path("local_field").asText(relationName + "_id");
        return new Relation(relationName, targetPlugin.isBlank() ? pluginKey : targetPlugin,
                targetEntity, node.path("type").asText("many_to_one"), localField,
                node.path("target_field").asText("id"));
    }

    private static final class MutableEntity {
        private final String name;
        private final String table;
        private final Set<String> fields;
        private final Map<String, Relation> relations = new LinkedHashMap<>();
        private final boolean tenantScoped;

        private MutableEntity(String name, String table, Set<String> fields, boolean tenantScoped) {
            this.name = name;
            this.table = table;
            this.fields = fields;
            this.tenantScoped = tenantScoped;
        }
    }
}
