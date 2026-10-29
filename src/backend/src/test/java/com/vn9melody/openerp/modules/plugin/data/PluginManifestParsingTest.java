package com.vn9melody.openerp.modules.plugin.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

/** Sprint 06: manifest 2.0 fields[] and top-level relations[] are accepted. */
public class PluginManifestParsingTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void parsesFieldsAndTopLevelRelations() throws Exception {
        var manifest = mapper.readTree("""
                {
                  "entities": [
                    {
                      "name": "Notification",
                      "table": "plg_in_app_notification_notifications",
                      "storage_scope": "TENANT",
                      "fields": [
                        { "name": "title", "type": "string", "required": true },
                        { "name": "recipient_id", "type": "uuid", "required": true }
                      ]
                    }
                  ],
                  "relations": [
                    {
                      "name": "recipient",
                      "owner_entity": "Notification",
                      "type": "MANY_TO_ONE",
                      "target": "core.user",
                      "storage": "SOFT_REF",
                      "target_display_field": "full_name"
                    }
                  ],
                  "queries": [
                    {
                      "id": "notification.list",
                      "mode": "READ",
                      "operation": "LIST",
                      "entity": "Notification",
                      "tenant_scope": "TENANT",
                      "select": ["id", "title", "recipient_id", "created_at"]
                    }
                  ]
                }
                """);

        PluginManifest parsed = PluginManifest.parse("in-app-notification", "1.0.0", manifest);

        PluginManifest.Entity entity = parsed.entities().get("Notification");
        assertTrue(entity.fields().contains("title"));
        assertTrue(entity.fields().contains("recipient_id"));
        assertTrue(entity.fields().contains("id"));
        assertTrue(entity.fields().contains("created_at"));
        assertEquals("core", entity.relations().get("recipient").targetPlugin());
        assertEquals("user", entity.relations().get("recipient").targetEntity());
    }
}
