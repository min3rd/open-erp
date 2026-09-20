package com.vn9melody.openerp.modules.plugin.model;

import com.vn9melody.openerp.core.enums.PluginCredentialScope;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Registry credential scoped to PLATFORM or TENANT (DES-03-DB section 2.4).
 * secret_cipher is AES-GCM encrypted; secrets are never returned by APIs or logs.
 */
@Entity
@Table(name = "plugin_credentials")
@RegisterEntity(
    entityName = "PluginCredential",
    pluginId = "core-plugin",
    table = "plugin_credentials",
    publicFields = {"id", "scope", "tenant_id", "name", "registry_host"}
)
public class PluginCredential extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 16)
    public PluginCredentialScope scope = PluginCredentialScope.PLATFORM;

    @Column(name = "tenant_id")
    public UUID tenantId;

    @Column(name = "name", nullable = false, length = 100)
    public String name;

    @Column(name = "registry_host", nullable = false, length = 255)
    public String registryHost;

    @Column(name = "username", length = 200)
    public String username;

    @Column(name = "secret_cipher", nullable = false, columnDefinition = "text")
    public String secretCipher;

    @Column(name = "secret_nonce", nullable = false, length = 64)
    public String secretNonce;

    @Column(name = "key_version", nullable = false)
    public int keyVersion = 1;

    @Column(name = "created_by")
    public UUID createdBy;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "last_used_at")
    public Instant lastUsedAt;
}
