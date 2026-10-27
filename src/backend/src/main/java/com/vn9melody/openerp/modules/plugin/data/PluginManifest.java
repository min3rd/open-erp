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
        Map<String, Entity> entities = new LinkedHashMap<>();
        for (JsonNode node : manifest.path("entities")) {
            String name = node.path("name").asText("");
            String table = node.path("table").asText("");
            if (name.isBlank() || table.isBlank()) {
                continue;
            }
            Set<String> fields = new LinkedHashSet<>();
            node.path("public_fields").forEach(field -> {
                if (field.isTextual()) {
                    fields.add(field.asText());
                }
            });
            Map<String, Relation> relations = new LinkedHashMap<>();
            for (JsonNode relationNode : node.path("relations")) {
                String relationName = relationNode.path("name").asText("");
                String targetEntity = relationNode.path("target_entity").asText("");
                if (relationName.isBlank() || targetEntity.isBlank()) {
                    continue;
                }
                relations.put(relationName, new Relation(relationName,
                        relationNode.path("target_plugin").asText(pluginKey),
                        targetEntity,
                        relationNode.path("type").asText("many_to_one"),
                        relationNode.path("local_field").asText(""),
                        relationNode.path("target_field").asText("id")));
            }
            boolean tenantScoped = !"SYSTEM".equalsIgnoreCase(node.path("storage_scope").asText("TENANT"));
            entities.put(name, new Entity(name, table, Set.copyOf(fields),
                    Map.copyOf(relations), tenantScoped));
        }
        Map<String, PluginQueryDescriptor> queries = new LinkedHashMap<>();
        for (JsonNode queryNode : manifest.path("queries")) {
            PluginQueryDescriptor query = PluginQueryDescriptor.parse(queryNode);
            queries.put(query.id(), query);
        }
        return new PluginManifest(pluginKey, version, Map.copyOf(entities), Map.copyOf(queries));
    }
}
