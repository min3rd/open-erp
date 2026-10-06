package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.modules.catalog.service.CatalogPluginManifestService;
import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Anti-drift check for the plugin descriptor: {@code plugins/catalog/plugin.json}
 * must match the running plugin — the declared permissions are seeded, the
 * declared entities are registered with the same tables, the plugin row exists
 * and both platforms declare their feature matrix (CONF-S05-001 AC-16).
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogPluginManifestTest extends CatalogApiTestBase {

    @Inject
    CatalogPluginManifestService manifestService;

    @Inject
    EntityManager entityManager;

    @Test
    @DisplayName("Plugin descriptor khớp plugin đang chạy (quyền, entity, bảng, plugin row)")
    public void manifestMatchesTheRunningPlugin() {
        JsonNode manifest = manifestService.manifest();

        assertEquals("catalog", manifest.path("id").asText());
        assertEquals("1.0.0", manifest.path("version").asText());
        assertEquals("CORE_IN_PROCESS", manifest.path("packaging").asText());

        // Desktop/Mobile matrix (AC-16).
        for (String platform : new String[] {"desktop", "mobile"}) {
            JsonNode node = manifest.path("platforms").path(platform);
            assertTrue(node.path("supported").asBoolean(), platform + " must be supported");
            assertTrue(node.path("features").size() > 0, platform + " must declare features");
        }

        // Every declared permission is seeded.
        for (JsonNode permission : manifest.path("permissions")) {
            String code = permission.path("code").asText();
            long count = ((Number) entityManager.createNativeQuery(
                    "select count(*) from permissions where code = :code")
                .setParameter("code", code).getSingleResult()).longValue();
            assertEquals(1L, count, "permission chưa seed: " + code);
        }

        // Every declared entity is registered with the same plugin id and table.
        for (JsonNode entity : manifest.path("entities")) {
            Object[] row = (Object[]) entityManager.createNativeQuery(
                    "select plugin_id, table_or_collection from sys_entity_registry where entity_name = :name")
                .setParameter("name", entity.path("name").asText())
                .getSingleResult();
            assertEquals("catalog", row[0], "plugin_id sai cho " + entity.path("name").asText());
            assertEquals(entity.path("table").asText(), row[1]);
            assertTrue(entity.path("public_fields").size() > 0);
        }

        long plugins = ((Number) entityManager.createNativeQuery(
                "select count(*) from plugin_catalog where plugin_key = 'catalog'").getSingleResult()).longValue();
        assertEquals(1L, plugins, "plugin_catalog thiếu row catalog");

        assertFalse(manifest.path("ui_manifest").path("screens").isEmpty(),
            "ui_manifest phải khai báo màn hình");
    }

    @Test
    @DisplayName("GET /api/v1/catalog/plugin/manifest trả descriptor cho người có quyền đọc")
    public void manifestEndpointServesTheDescriptor() {
        given()
            .header("Authorization", bearerA)
            .when().get(CATALOG + "/plugin/manifest")
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo("CATALOG_PLUGIN_MANIFEST_SUCCESS"))
            .body("data.id", equalTo("catalog"))
            .body("data.platforms.mobile.supported", equalTo(true));
    }
}
