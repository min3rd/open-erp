package com.vn9melody.openerp.modules.plugin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCredentialScope;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginArtifactUploadService;
import com.vn9melody.openerp.modules.plugin.service.PluginCredentialService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-336/332: registry credentials (AES-GCM at rest, scopes) and tenant
 * artifact upload ownership, on real PostgreSQL.
 */
@QuarkusTest
public class PluginCredentialAndUploadTest {

    @Inject
    PluginCredentialService credentialService;

    @Inject
    PluginArtifactUploadService uploadService;

    @Inject
    EntityManager em;

    private UUID tenantA;
    private UUID tenantB;

    @BeforeEach
    @Transactional
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();
        tenantA = S2EngineFixtures.insertTenant(em, suffix + "a");
        tenantB = S2EngineFixtures.insertTenant(em, suffix + "b");
    }

    @Test
    @Transactional
    @DisplayName("TASK-336: credential platform mã hóa và resolve được secret")
    public void testPlatformCredentialRoundTrip() {
        String host = "registry-e2e-" + UUID.randomUUID().toString().substring(0, 8) + ".local";
        PluginResponses.CredentialItem item = credentialService.create(PluginCredentialScope.PLATFORM, null,
                "main", host, "pull-user", "s3cret-token", null);
        assertEquals("PLATFORM", item.scope);
        assertEquals(host, item.registryHost);
        assertNull(item.connected);

        PluginCredentialService.ResolvedCredential resolved = credentialService.resolve(null, host);
        assertNotNull(resolved);
        assertEquals("pull-user", resolved.username());
        assertEquals("s3cret-token", resolved.secret());
    }

    @Test
    @Transactional
    @DisplayName("TASK-336: trùng host+name bị chặn, tenant scope tách biệt")
    public void testDuplicateAndTenantScope() {
        String host = "registry-dup-" + UUID.randomUUID().toString().substring(0, 8) + ".local";
        credentialService.create(PluginCredentialScope.TENANT, tenantA, "tenant-a", host, "user", "secret-a", null);
        ApiException duplicate = assertThrows(ApiException.class, () -> credentialService.create(
                PluginCredentialScope.TENANT, tenantA, "tenant-a", host, "user", "again", null));
        assertEquals(PluginErrorCode.PLUGIN_CREDENTIAL_DUPLICATE_HOST, duplicate.getErrorCode());

        assertNotNull(credentialService.resolve(tenantA, host));
        assertNull(credentialService.resolve(tenantB, host));
    }

    @Test
    @DisplayName("TASK-332: artifact upload gắn tiền tố tenant và chặn tenant khác")
    public void testUploadOwnership() {
        byte[] payload = "plugin-bundle".getBytes(StandardCharsets.UTF_8);
        PluginResponses.UploadResult result = uploadService.upload("bundle.zip",
                new ByteArrayInputStream(payload), tenantA);
        assertTrue(result.artifactRef.contains("t" + tenantA.toString().replace("-", "").substring(0, 8) + "-"));
        assertEquals(64, result.checksum.length());
        assertEquals(payload.length, result.sizeBytes);

        uploadService.assertOwnedBy(result.artifactRef, tenantA);
        ApiException denied = assertThrows(ApiException.class,
                () -> uploadService.assertOwnedBy(result.artifactRef, tenantB));
        assertEquals(PluginErrorCode.PLUGIN_ARTIFACT_NOT_OWNED, denied.getErrorCode());
    }
}
