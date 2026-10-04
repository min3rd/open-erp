package com.vn9melody.openerp.core.enums;

/**
 * UI contribution render technique (DES-03-UI section 5.2, Gate 2026-09-19).
 * Web Components and Module Federation are preferred; IFRAME is the sandbox
 * fallback for plugins that do not implement the WC/MF contract.
 */
public enum PluginRenderMode {
    WEB_COMPONENT,
    MODULE_FEDERATION,
    IFRAME;

    public static PluginRenderMode fromString(String value) {
        return EnumParser.parse(PluginRenderMode.class, value, IFRAME);
    }
}
