package com.vn9melody.openerp.modules.plugin.data;

import java.util.UUID;

/** Authenticated plugin identity derived from mTLS/service token, never from the request body. */
public record PluginServiceIdentity(String pluginKey, UUID tenantId, Scope scope) {

    public enum Scope { TENANT, SYSTEM }

    public boolean system() {
        return scope == Scope.SYSTEM;
    }
}
