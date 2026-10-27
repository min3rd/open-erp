package com.vn9melody.openerp.modules.plugin.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.jboss.logging.Logger;

/**
 * Loads and validates the published query descriptors of a plugin version.
 * Validation happens once per (plugin, version); runtime calls only carry a
 * query id and parameters.
 */
@ApplicationScoped
public class PluginDescriptorRegistry {

    private static final Logger LOG = Logger.getLogger(PluginDescriptorRegistry.class);

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    private final Map<String, PluginManifest> cache = new ConcurrentHashMap<>();

    @Transactional
    public PluginManifest manifest(String pluginKey, String version) {
        String key = pluginKey + "@" + version;
        PluginManifest cached = cache.get(key);
        if (cached != null) {
            return cached;
        }
        PluginManifest loaded = load(pluginKey, version);
        cache.put(key, loaded);
        return loaded;
    }

    public void evict(String pluginKey) {
        cache.keySet().removeIf(key -> key.startsWith(pluginKey + "@"));
    }

    private PluginManifest load(String pluginKey, String version) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new PluginDataException(PluginDataException.Code.PLUGIN_NOT_ACTIVE,
                    "PLUGIN_DATA_PLUGIN_NOT_FOUND");
        }
        PluginVersion published = versionRepository.findByCatalogAndVersion(catalog.id, version)
                .orElseThrow(() -> new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                        "PLUGIN_DATA_VERSION_NOT_FOUND"));
        JsonNode manifestNode = published.manifest;
        PluginManifest manifest = PluginManifest.parse(pluginKey, version, manifestNode);
        validate(manifest);
        LOG.infof("Plugin data descriptors: loaded %d queries for %s@%s",
                manifest.queries().size(), pluginKey, version);
        return manifest;
    }

    private void validate(PluginManifest manifest) {
        for (PluginQueryDescriptor query : manifest.queries().values()) {
            PluginManifest.Entity entity = manifest.entities().get(query.entity());
            if (entity == null) {
                fail(query, "unknown entity " + query.entity());
            }
            if (query.mode() == PluginQueryDescriptor.Mode.READ
                    && (query.operation() == PluginQueryDescriptor.Operation.INSERT
                    || query.operation() == PluginQueryDescriptor.Operation.UPDATE
                    || query.operation() == PluginQueryDescriptor.Operation.DELETE)) {
                fail(query, "write operation on READ descriptor");
            }
            if (query.mode() == PluginQueryDescriptor.Mode.WRITE
                    && (query.operation() == PluginQueryDescriptor.Operation.LIST
                    || query.operation() == PluginQueryDescriptor.Operation.GET)) {
                fail(query, "read operation on WRITE descriptor");
            }
            if (query.mode() == PluginQueryDescriptor.Mode.WRITE
                    && query.scope() == PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM) {
                fail(query, "write descriptor cannot use TENANT_OR_SYSTEM");
            }
            query.select().forEach(field -> field(entity, query, field));
            query.filters().forEach(filter -> field(entity, query, filter.field()));
            query.search().forEach(search -> search.fields()
                    .forEach(field -> field(entity, query, field)));
            query.sort().forEach(sort -> field(entity, query, sort.field()));
            query.values().keySet().forEach(field -> field(entity, query, field));
            query.returning().forEach(field -> field(entity, query, field));
            for (PluginQueryDescriptor.Join join : query.joins()) {
                PluginManifest.Relation relation = entity.relations().get(join.relation());
                if (relation == null) {
                    fail(query, "unknown relation " + join.relation());
                }
                PluginManifest.Entity target = manifest.entities().get(relation.targetEntity());
                if (target == null) {
                    fail(query, "cross-plugin relation " + join.relation()
                            + " is not available in this version");
                }
                join.select().forEach(field -> field(target, query, field));
            }
        }
    }

    private void field(PluginManifest.Entity entity, PluginQueryDescriptor query, String field) {
        if (field == null || field.isBlank()) {
            fail(query, "blank field");
        }
        if (!entity.fields().contains(field)) {
            fail(query, "field " + field + " is not public on " + entity.name());
        }
    }

    private void fail(PluginQueryDescriptor query, String detail) {
        LOG.errorf("Invalid plugin query descriptor %s: %s", query.id(), detail);
        throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                "PLUGIN_DATA_QUERY_INVALID");
    }
}
