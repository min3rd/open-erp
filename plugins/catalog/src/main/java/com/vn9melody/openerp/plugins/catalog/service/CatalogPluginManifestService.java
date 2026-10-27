package com.vn9melody.openerp.plugins.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;

/**
 * Reads the plugin descriptor of the in-process {@code catalog} plugin
 * ({@code plugins/catalog/plugin.json}) — the single source of truth for the
 * Desktop/Mobile feature matrix (CONF-S05-001 AC-16), the permissions, the
 * registered entities and the UI screens. The file mirrors the CLI's
 * {@code plugin.json} shape so packaging the plugin later changes nothing.
 */
@ApplicationScoped
public class CatalogPluginManifestService {

    public static final String MANIFEST_RESOURCE = "plugins/catalog/plugin.json";
    public static final String PLUGIN_ID = "catalog";

    @Inject
    ObjectMapper objectMapper;

    private volatile JsonNode cached;

    public JsonNode manifest() {
        JsonNode current = cached;
        if (current == null) {
            current = load();
            cached = current;
        }
        return current;
    }

    private JsonNode load() {
        try (InputStream stream = Thread.currentThread().getContextClassLoader()
            .getResourceAsStream(MANIFEST_RESOURCE)) {
            if (stream == null) {
                throw new IllegalStateException("Missing plugin descriptor " + MANIFEST_RESOURCE);
            }
            return objectMapper.readTree(stream);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read plugin descriptor " + MANIFEST_RESOURCE, e);
        }
    }
}
