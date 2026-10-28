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

        assertEquals(57, manifest.queries().size());
        assertTrue(manifest.entities().get("CatalogType").fields().contains("attributes_schema"));
        assertTrue(manifest.entities().get("CatalogItem").fields().contains("attributes"));

        PluginQueryDescriptor types = manifest.requireQuery("catalog.types.visible");
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, types.scope());

        PluginQueryDescriptor items = manifest.requireQuery("catalog.items.by.type");
        assertEquals(PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM, items.scope());
        assertNotNull(items.search());
        assertEquals(1, items.search().size());

        PluginQueryDescriptor admin = manifest.requireQuery("catalog.items.admin");
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
    }
}
