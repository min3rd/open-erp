package com.vn9melody.openerp.modules.plugin.artifact;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Minimal OCI / Docker Registry v2 client (TASK-331): resolves an image
 * reference to its immutable manifest digest using the registry token flow
 * (401 {@code WWW-Authenticate: Bearer} challenge -> token endpoint -> retry).
 *
 * <p>HTTPS only, redirects refused, timeouts and a manifest size cap applied.
 * Host allowlist/SSRF checks stay in {@link PluginArtifactVerifier} and run
 * before this client is invoked.</p>
 */
@ApplicationScoped
public class OciRegistryClient {

    private static final Logger LOG = Logger.getLogger(OciRegistryClient.class);

    private static final String DOCKER_HUB_HOST = "registry-1.docker.io";
    private static final String MANIFEST_ACCEPT = String.join(",",
            "application/vnd.oci.image.manifest.v1+json",
            "application/vnd.oci.image.index.v1+json",
            "application/vnd.docker.distribution.manifest.v2+json",
            "application/vnd.docker.distribution.manifest.list.v2+json");

    @ConfigProperty(name = "openerp.plugin.oci.timeout-seconds", defaultValue = "15")
    int timeoutSeconds;

    @ConfigProperty(name = "openerp.plugin.oci.max-manifest-bytes", defaultValue = "4194304")
    int maxManifestBytes;

    // Dev-only escape hatch: a loopback registry (local registry:2) speaks HTTP.
    // Public hosts stay HTTPS-only regardless of this flag.
    @ConfigProperty(name = "openerp.plugin.oci.allow-http", defaultValue = "false")
    boolean allowHttp;

    @Inject
    ObjectMapper objectMapper;

    public record Credential(String username, String secret) {}

    public record RegistryRef(String host, String repository, String reference) {
        public boolean isIncomplete() {
            return host == null || host.isBlank() || repository == null || repository.isBlank()
                    || reference == null || reference.isBlank();
        }
    }

    /** Splits a Docker Hub style image reference ({@code ns/name[:tag]}) into host/repository/reference. */
    public static RegistryRef parseDockerHubRef(String imageRef, String explicitTag) {
        String raw = imageRef == null ? "" : imageRef.trim();
        if (raw.isEmpty()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID, "image_ref is required");
        }
        String host = DOCKER_HUB_HOST;
        String remainder = raw;
        int slash = raw.indexOf('/');
        if (slash > 0) {
            String first = raw.substring(0, slash);
            if (first.contains(".") || first.contains(":") || first.equalsIgnoreCase("localhost")) {
                host = first;
                remainder = raw.substring(slash + 1);
            }
        }
        String reference = explicitTag != null && !explicitTag.isBlank() ? explicitTag.trim() : null;
        int at = remainder.indexOf('@');
        if (at >= 0) {
            reference = remainder.substring(at + 1);
            remainder = remainder.substring(0, at);
        } else if (reference == null) {
            int colon = remainder.lastIndexOf(':');
            if (colon > 0 && remainder.indexOf('/') < colon) {
                reference = remainder.substring(colon + 1);
                remainder = remainder.substring(0, colon);
            }
        }
        String repository = remainder;
        if (DOCKER_HUB_HOST.equals(host) && !repository.contains("/")) {
            repository = "library/" + repository;
        }
        if (reference == null || reference.isBlank()) {
            reference = "latest";
        }
        return new RegistryRef(host, repository, reference);
    }

    public static String hostFromRegistryUrl(String registryUrl) {
        if (registryUrl == null || registryUrl.isBlank()) {
            return null;
        }
        String normalized = registryUrl.trim();
        if (!normalized.contains("://")) {
            normalized = "https://" + normalized;
        }
        try {
            return URI.create(normalized).getHost();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** Resolves the immutable {@code sha256:...} digest of the referenced manifest. */
    public String resolveDigest(RegistryRef ref, Credential credential) {
        if (ref == null || ref.isIncomplete()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID,
                    "Registry reference is incomplete");
        }
        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NEVER)
                .connectTimeout(Duration.ofSeconds(timeoutSeconds))
                .build();
        URI manifestUri = URI.create(scheme(ref.host()) + "://" + ref.host() + "/v2/" + ref.repository()
                + "/manifests/" + ref.reference());
        HttpResponse<byte[]> response = send(client, manifestUri, null);
        if (response.statusCode() == 401) {
            response = send(client, manifestUri, fetchBearerToken(client, response, ref, credential));
        }
        if (response.statusCode() == 401 || response.statusCode() == 403) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "Registry authentication failed");
        }
        if (response.statusCode() == 404) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED, "Image manifest not found");
        }
        if (response.statusCode() != 200) {
            throw new ApiException(502, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Registry returned status " + response.statusCode());
        }
        String header = response.headers().firstValue("Docker-Content-Digest").orElse(null);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return "sha256:" + sha256Hex(response.body());
    }

    private String scheme(String host) {
        return allowHttp && isLoopback(host) ? "http" : "https";
    }

    private boolean isLoopback(String host) {
        if (host == null) {
            return false;
        }
        String h = host.toLowerCase(Locale.ROOT);
        return h.equals("localhost") || h.equals("::1") || h.equals("[::1]") || h.startsWith("127.");
    }

    private HttpResponse<byte[]> send(HttpClient client, URI uri, String bearer) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Accept", MANIFEST_ACCEPT)
                .GET();
        if (bearer != null) {
            builder.header("Authorization", "Bearer " + bearer);
        }
        try {
            HttpResponse<byte[]> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
            // ponytail: the body is buffered before this check, so a hostile registry can
            // still allocate up to the connection limit. Manifests are small (<1MB); switch
            // to a bounded BodySubscriber if untrusted registries ever return huge bodies.
            if (response.body() != null && response.body().length > maxManifestBytes) {
                throw new ApiException(413, PluginErrorCode.PLUGIN_ARTIFACT_TOO_LARGE,
                        "Manifest exceeds the size limit");
            }
            return response;
        } catch (IOException e) {
            throw new ApiException(502, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Cannot reach the registry: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(502, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Registry request interrupted");
        }
    }

    private String fetchBearerToken(HttpClient client, HttpResponse<byte[]> challenge, RegistryRef ref,
                                    Credential credential) {
        String header = challenge.headers().firstValue("WWW-Authenticate").orElse(null);
        if (header == null || !header.regionMatches(true, 0, "Bearer", 0, 6)) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "Registry requires an unsupported authentication scheme");
        }
        Map<String, String> params = parseChallenge(header.substring(6));
        String realm = params.get("realm");
        if (realm == null || realm.isBlank()) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                    "Registry token realm is missing");
        }
        StringBuilder url = new StringBuilder(realm);
        appendQuery(url, "service", params.get("service"));
        appendQuery(url, "scope", params.getOrDefault("scope", "repository:" + ref.repository() + ":pull"));
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url.toString()))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .GET();
        if (credential != null && credential.username() != null && !credential.username().isBlank()) {
            String basic = Base64.getEncoder().encodeToString(
                    (credential.username() + ":" + (credential.secret() == null ? "" : credential.secret()))
                            .getBytes(StandardCharsets.UTF_8));
            builder.header("Authorization", "Basic " + basic);
        }
        try {
            HttpResponse<byte[]> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                throw new ApiException(403, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                        "Registry token request failed with status " + response.statusCode());
            }
            JsonNode json = objectMapper.readTree(response.body());
            String token = json.path("token").asText(json.path("access_token").asText(null));
            if (token == null || token.isBlank()) {
                throw new ApiException(403, PluginErrorCode.PLUGIN_CREDENTIAL_AUTH_FAILED,
                        "Registry token response is malformed");
            }
            return token;
        } catch (IOException e) {
            throw new ApiException(502, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Cannot reach the registry token endpoint");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(502, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Registry token request interrupted");
        }
    }

    // ponytail: naive comma split; realm/service/scope never contain commas in
    // practice. Switch to a quote-aware parser if a registry ever does.
    private Map<String, String> parseChallenge(String value) {
        Map<String, String> params = new HashMap<>();
        for (String part : value.split(",")) {
            int eq = part.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String key = part.substring(0, eq).trim().toLowerCase(Locale.ROOT);
            String val = part.substring(eq + 1).trim();
            if (val.length() >= 2 && val.startsWith("\"") && val.endsWith("\"")) {
                val = val.substring(1, val.length() - 1);
            }
            params.put(key, val);
        }
        return params;
    }

    private void appendQuery(StringBuilder url, String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        url.append(url.indexOf("?") >= 0 ? '&' : '?')
                .append(key).append('=').append(URLEncoder.encode(value, StandardCharsets.UTF_8));
    }

    private String sha256Hex(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
