package com.vn9melody.openerp.modules.plugin.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

/**
 * TASK-402 P2.1: the seeded catalog manifest must validate against the query
 * compiler contract (entities, public fields, scopes, filters).
 */
@QuarkusTest
public class CatalogQueryDescriptorManifestTest {

    @Inject
    PluginDescriptorRegistry registry;

    @Test
    void seededCatalogDescriptorsAreValid() {
        PluginManifest manifest = registry.manifest("catalog", "1.0.0");

        assertEquals(75, manifest.queries().size());
        assertTrue(manifest.entities().get("CatalogType").fields().contains("attributes_schema"));
        assertTrue(manifest.entities().get("CatalogItem").fields().contains("attributes"));
        assertTrue(manifest.entities().get("CatalogTypeRelation").fields().contains("parent_type_id"));

        PluginQueryDescriptor types = manifest.requireQuery("catalog.types.visible");
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, types.scope());

        PluginQueryDescriptor items = manifest.requireQuery("catalog.items.by.type");
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, items.scope());
        assertNotNull(items.search());
        assertEquals(1, items.search().size());

        PluginQueryDescriptor admin = manifest.requireQuery("catalog.items.admin");
        assertEquals(PluginQueryDescriptor.Operation.MERGED_LIST, admin.operation());
        assertEquals("code", admin.mergeKey());
        assertEquals(2, admin.exists().size());
        assertEquals(2, admin.sort().size());

        PluginQueryDescriptor merged = manifest.requireQuery("catalog.items.merged.options");
        assertEquals(PluginQueryDescriptor.Operation.MERGED_LIST, merged.operation());
        assertEquals("code", merged.mergeKey());
        assertEquals(1, merged.postFilters().size());

        PluginQueryDescriptor grants = manifest.requireQuery("catalog.grants.by.type");
        assertEquals(PluginQueryDescriptor.Scope.TENANT, grants.scope());

        PluginQueryDescriptor systemCodes = manifest.requireQuery("catalog.items.system.codes");
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, systemCodes.scope());

        PluginQueryDescriptor systemItems = manifest.requireQuery("catalog.items.system.by.type");
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, systemItems.scope());

        PluginQueryDescriptor mirrorInsert = manifest.requireQuery("catalog.item.insert.mirror");
        assertEquals(PluginQueryDescriptor.Mode.WRITE, mirrorInsert.mode());
        assertTrue(mirrorInsert.systemRow());

        PluginQueryDescriptor insert = manifest.requireQuery("catalog.item.insert");
        assertEquals(PluginQueryDescriptor.Mode.WRITE, insert.mode());
        assertTrue(insert.values().get("attributes").optional());
        assertTrue(insert.values().get("attributes").allowNull());

        PluginQueryDescriptor close = manifest.requireQuery("catalog.item.close");
        assertEquals(PluginQueryDescriptor.Operation.UPDATE, close.operation());

        PluginQueryDescriptor edgeActive = manifest.requireQuery("catalog.edge.active");
        assertEquals(PluginQueryDescriptor.Operation.LIST, edgeActive.operation());

        PluginQueryDescriptor parents = manifest.requireQuery("catalog.type.relations.parents");
        assertEquals(PluginQueryDescriptor.Operation.LIST, parents.operation());
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, parents.scope());
        PluginQueryDescriptor children = manifest.requireQuery("catalog.type.relations.children");
        assertEquals("parent_type_id", children.filters().get(0).field());
        PluginQueryDescriptor relationInsert = manifest.requireQuery("catalog.type.relation.insert");
        assertEquals(PluginQueryDescriptor.Scope.TENANT, relationInsert.scope());
        PluginQueryDescriptor relationDelete = manifest.requireQuery("catalog.type.relation.delete.children");
        assertEquals(PluginQueryDescriptor.Operation.DELETE, relationDelete.operation());

        assertTrue(manifest.entities().get("CatalogType").fields().contains("system_type_id"));
        assertTrue(manifest.entities().get("CatalogItem").fields().contains("system_item_id"));
        PluginQueryDescriptor cloneItems = manifest.requireQuery("catalog.clone.items.system");
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, cloneItems.scope());
        PluginQueryDescriptor cloneEdges = manifest.requireQuery("catalog.clone.edges.tenant");
        assertEquals(PluginQueryDescriptor.Scope.TENANT, cloneEdges.scope());
        PluginQueryDescriptor cloneTypeDelete = manifest.requireQuery("catalog.clone.type.delete");
        assertEquals(PluginQueryDescriptor.Operation.DELETE, cloneTypeDelete.operation());
    }
}
