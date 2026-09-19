package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Read-only plugin catalog exposed to the platform portal (FEAT-20).
 *
 * <p>The Plugin Manager does not exist yet in Sprint 02, so the catalog is a
 * deliberately extensible registry: {@code core} is always first and ops can append
 * extra plugins through the {@code openerp.platform.plugin-catalog} config property
 * (CSV of {@code key[:name_key[:description_key]]}) without touching code. The
 * frontend resolves the labels from {@code name_key}/{@code description_key}; when the
 * Plugin Manager lands it will feed the same list from the entity/module registry
 * without changing the API contract.</p>
 */
@ApplicationScoped
public class PluginCatalogService {

    private static final Logger LOG = Logger.getLogger(PluginCatalogService.class);

    /** i18n keys of the mandatory core plugin. */
    public static final String CORE_NAME_KEY = "PLUGIN_CORE_NAME";
    public static final String CORE_DESCRIPTION_KEY = "PLUGIN_CORE_DESCRIPTION";

    /** Single extensible catalog definition (key, name i18n key, description i18n key, mandatory). */
    public record PluginDefinition(String key, String nameKey, String descriptionKey, boolean core) {}

    private static final PluginDefinition CORE_DEFINITION = new PluginDefinition(
        TenantPluginAllowlistService.PLUGIN_CORE, CORE_NAME_KEY, CORE_DESCRIPTION_KEY, true);

    /**
     * Extra catalog plugins declared by ops (see application.properties for the
     * documented CSV syntax). Empty/absent means "only {@code core}".
     */
    @ConfigProperty(name = "openerp.platform.plugin-catalog")
    Optional<String> configuredPlugins;

    public List<PlatformResponses.PluginItem> listPlugins() {
        List<PluginDefinition> definitions = catalog();
        List<PlatformResponses.PluginItem> items = new ArrayList<>(definitions.size());
        for (PluginDefinition definition : definitions) {
            PlatformResponses.PluginItem item = new PlatformResponses.PluginItem();
            item.key = definition.key();
            item.nameKey = definition.nameKey();
            item.descriptionKey = definition.descriptionKey();
            item.isCore = definition.core();
            items.add(item);
        }
        return items;
    }

    /**
     * Unified catalog: mandatory {@code core} first, then the configured plugins in
     * declaration order. Keys are deduped case-insensitively; a configured {@code core}
     * entry never overrides the mandatory definition.
     */
    public List<PluginDefinition> catalog() {
        List<PluginDefinition> definitions = new ArrayList<>();
        definitions.add(CORE_DEFINITION);
        Set<String> seen = new HashSet<>();
        seen.add(normalize(CORE_DEFINITION.key()));
        for (String entry : configuredPlugins.orElse("").split(",")) {
            PluginDefinition definition = parseEntry(entry);
            if (definition == null) {
                continue;
            }
            if (!seen.add(normalize(definition.key()))) {
                LOG.warnf("Duplicate plugin key '%s' in openerp.platform.plugin-catalog ignored",
                    definition.key());
                continue;
            }
            definitions.add(definition);
        }
        return definitions;
    }

    /**
     * Parses one CSV entry: {@code key}, {@code key:name_key} or
     * {@code key:name_key:description_key}. Missing i18n keys are derived as
     * {@code PLUGIN_<KEY>_NAME} / {@code PLUGIN_<KEY>_DESCRIPTION}. Blank entries return
     * {@code null}.
     */
    private static PluginDefinition parseEntry(String entry) {
        if (entry == null || entry.isBlank()) {
            return null;
        }
        String[] parts = entry.trim().split(":", 3);
        String key = parts[0].trim();
        if (key.isEmpty()) {
            return null;
        }
        String nameKey = parts.length > 1 && !parts[1].isBlank() ? parts[1].trim() : defaultNameKey(key);
        String descriptionKey = parts.length > 2 && !parts[2].isBlank()
            ? parts[2].trim() : defaultDescriptionKey(key);
        return new PluginDefinition(key, nameKey, descriptionKey, false);
    }

    static String defaultNameKey(String key) {
        return "PLUGIN_" + normalize(key) + "_NAME";
    }

    static String defaultDescriptionKey(String key) {
        return "PLUGIN_" + normalize(key) + "_DESCRIPTION";
    }

    private static String normalize(String key) {
        return key.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
    }
}
