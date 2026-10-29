package com.vn9melody.openerp.core.enums;

/**
 * UI contribution render technique (DES-03-UI section 5.2, Gate 2026-09-19).
 * Iframe hosting was removed in Sprint 06; plugins render as Web Components or
 * Module Federation remotes inside the Core layout.
 */
public enum PluginRenderMode {
    WEB_COMPONENT,
    MODULE_FEDERATION;

    public static PluginRenderMode fromString(String value) {
        return EnumParser.parse(PluginRenderMode.class, value, WEB_COMPONENT);
    }
}
