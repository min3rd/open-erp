package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCredentialScope;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.api.PluginSupport;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginCredential;
import com.vn9melody.openerp.modules.plugin.repository.PluginCredentialRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Registry credentials with platform/tenant scopes (TASK-336 / Gate Q7).
 * Secrets are AES-GCM encrypted at rest; APIs never return them.
 */
@ApplicationScoped
public class PluginCredentialService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int GCM_TAG_BITS = 128;

    @Inject
    PluginCredentialRepository repository;

    @ConfigProperty(name = "openerp.plugin.credentials.master-key", defaultValue = "")
    String masterKeyBase64;

    public PluginResponses.CredentialItem create(PluginCredentialScope scope, UUID tenantId, String name,
                                                 String registryHost, String username, String secret,
                                                 UUID actorId) {
        if (name == null || name.isBlank() || registryHost == null || registryHost.isBlank()
                || secret == null || secret.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "name, registry_host and secret are required");
        }
        if (!PluginSupport.isValidPluginKey(name.toLowerCase().replace(' ', '-'))
                && name.length() > 100) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED, "name is too long");
        }
        boolean duplicate = scope == PluginCredentialScope.PLATFORM
                ? repository.findPlatformByHostAndName(registryHost, name).isPresent()
                : repository.findTenantByHostAndName(tenantId, registryHost, name).isPresent();
        if (duplicate) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_CREDENTIAL_DUPLICATE_HOST,
                    "A credential for this registry host and name already exists");
        }
        Encrypted encrypted = encrypt(secret);
        PluginCredential entity = new PluginCredential();
        entity.scope = scope;
        entity.tenantId = scope == PluginCredentialScope.TENANT ? tenantId : null;
        entity.name = name.trim();
        entity.registryHost = registryHost.trim().toLowerCase();
        entity.username = username;
        entity.secretCipher = encrypted.cipher;
        entity.secretNonce = encrypted.nonce;
        entity.createdBy = actorId;
        entity.createdAt = Instant.now();
        repository.persist(entity);
        return toItem(entity);
    }

    @Transactional
    public PluginResponses.CredentialItem update(UUID id, String name, String username, String secret) {
        PluginCredential entity = repository.findById(id);
        if (entity == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_CREDENTIAL_NOT_FOUND, "Credential not found");
        }
        if (name != null && !name.isBlank()) {
            entity.name = name.trim();
        }
        if (username != null) {
            entity.username = username;
        }
        if (secret != null && !secret.isBlank()) {
            Encrypted encrypted = encrypt(secret);
            entity.secretCipher = encrypted.cipher;
            entity.secretNonce = encrypted.nonce;
        }
        return toItem(entity);
    }

    @Transactional
    public void delete(UUID id) {
        PluginCredential entity = repository.findById(id);
        if (entity == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_CREDENTIAL_NOT_FOUND, "Credential not found");
        }
        repository.delete(entity);
    }

    @Transactional
    public List<PluginResponses.CredentialItem> list(PluginCredentialScope scope, UUID tenantId) {
        List<PluginCredential> rows = scope == PluginCredentialScope.PLATFORM
                ? repository.listPlatform()
                : repository.listByTenant(tenantId);
        rows.forEach(row -> row.lastUsedAt = row.lastUsedAt);
        return rows.stream().map(this::toItem).toList();
    }

    @Transactional
    public PluginResponses.CredentialItem test(UUID id) {
        PluginCredential entity = repository.findById(id);
        if (entity == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_CREDENTIAL_NOT_FOUND, "Credential not found");
        }
        String secret = decrypt(entity.secretCipher, entity.secretNonce);
        boolean reachable = probe(entity.registryHost, entity.username, secret);
        entity.lastUsedAt = Instant.now();
        PluginResponses.CredentialItem item = toItem(entity);
        item.connected = reachable;
        if (!reachable) {
            throw new ApiException(502, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "Registry is not reachable with this credential");
        }
        return item;
    }

    public ResolvedCredential resolve(UUID tenantId, String registryHost) {
        if (registryHost == null || registryHost.isBlank()) {
            return null;
        }
        String host = registryHost.trim().toLowerCase();
        PluginCredential entity = repository.listByTenant(tenantId).stream()
                .filter(row -> host.equals(row.registryHost))
                .findFirst()
                .orElseGet(() -> repository.listPlatform().stream()
                        .filter(row -> host.equals(row.registryHost))
                        .findFirst()
                        .orElse(null));
        if (entity == null) {
            return null;
        }
        entity.lastUsedAt = Instant.now();
        return new ResolvedCredential(entity.username, decrypt(entity.secretCipher, entity.secretNonce));
    }

    public record ResolvedCredential(String username, String secret) {}

    private boolean probe(String registryHost, String username, String secret) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create("https://" + registryHost + "/v2/"))
                    .timeout(Duration.ofSeconds(5))
                    .GET();
            if (username != null && !username.isBlank()) {
                String token = Base64.getEncoder().encodeToString(
                        (username + ":" + secret).getBytes(StandardCharsets.UTF_8));
                builder.header("Authorization", "Basic " + token);
            }
            HttpResponse<Void> response = HttpClient.newHttpClient()
                    .send(builder.build(), HttpResponse.BodyHandlers.discarding());
            return response.statusCode() == 200 || response.statusCode() == 401;
        } catch (Exception e) {
            return false;
        }
    }

    private Encrypted encrypt(String secret) {
        try {
            byte[] nonce = new byte[12];
            RANDOM.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(GCM_TAG_BITS, nonce));
            byte[] encrypted = cipher.doFinal(secret.getBytes(StandardCharsets.UTF_8));
            return new Encrypted(Base64.getEncoder().encodeToString(encrypted),
                    Base64.getEncoder().encodeToString(nonce));
        } catch (Exception e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "Cannot encrypt credential");
        }
    }

    public String decrypt(String cipherText, String nonce) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(),
                    new GCMParameterSpec(GCM_TAG_BITS, Base64.getDecoder().decode(nonce)));
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(cipherText));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "Cannot decrypt credential");
        }
    }

    private SecretKeySpec key() {
        if (masterKeyBase64 == null || masterKeyBase64.isBlank()) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "openerp.plugin.credentials.master-key is not configured");
        }
        byte[] keyBytes = Base64.getDecoder().decode(masterKeyBase64.trim());
        if (keyBytes.length != 32) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "master key must be 32 bytes (Base64)");
        }
        return new SecretKeySpec(keyBytes, "AES");
    }

    private PluginResponses.CredentialItem toItem(PluginCredential entity) {
        PluginResponses.CredentialItem item = new PluginResponses.CredentialItem();
        item.id = entity.id.toString();
        item.scope = entity.scope.name();
        item.name = entity.name;
        item.registryHost = entity.registryHost;
        item.username = entity.username;
        item.lastUsedAt = entity.lastUsedAt;
        return item;
    }

    private record Encrypted(String cipher, String nonce) {}
}
