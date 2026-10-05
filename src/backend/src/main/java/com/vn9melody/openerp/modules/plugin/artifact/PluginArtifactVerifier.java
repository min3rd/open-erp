package com.vn9melody.openerp.modules.plugin.artifact;


import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Artifact verification (TASK-333): registry host allowlist/SSRF guards and
 * bundle checksum verification before a version is persisted.
 */
@ApplicationScoped
public class PluginArtifactVerifier {

    private static final String DOCKER_HUB_HOST = "registry-1.docker.io";
    private static final Set<String> PUBLIC_REGISTRY_DEFAULTS = Set.of(
            "registry-1.docker.io", "docker.io", "ghcr.io", "quay.io");

    @ConfigProperty(name = "openerp.plugin.registry-allowed-hosts")
    java.util.Optional<String> allowedHosts;

    @Inject
    ArtifactStorage artifactStorage;

    public void verifyRegistry(String source, String imageRef, String registryUrl) {
        String type = source == null ? "" : source.trim().toUpperCase(Locale.ROOT);
        if (type.isBlank() || "JAR_BUNDLE".equals(type)) {
            return;
        }
        String host = resolveHost(source, imageRef, registryUrl);
        if (host == null || host.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID,
                    "Cannot resolve registry host from the source");
        }
        String normalized = host.toLowerCase(Locale.ROOT);
        Set<String> allowlist = allowlist();
        if (isPrivateHost(normalized) && !allowlist.contains(normalized)) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_REGISTRY_NOT_ALLOWED,
                    "Private or loopback registry hosts are not allowed");
        }
        if (!allowlist.isEmpty() && !allowlist.contains(normalized)) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_REGISTRY_NOT_ALLOWED,
                    "Registry host is not in the allowlist");
        }
    }

    public void verifyBundleChecksum(String artifactRef, String declaredChecksum) {
        if (artifactRef == null || artifactRef.isBlank()
                || declaredChecksum == null || declaredChecksum.isBlank()) {
            return;
        }
        String expected = declaredChecksum.trim().toLowerCase(Locale.ROOT);
        if (expected.startsWith("sha256:")) {
            expected = expected.substring("sha256:".length());
        }
        try (InputStream stream = artifactStorage.open(artifactRef)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = stream.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            String actual = toHex(digest.digest());
            if (!actual.equals(expected)) {
                throw new ApiException(409, PluginErrorCode.PLUGIN_ARTIFACT_CHECKSUM_MISMATCH,
                        "Bundle checksum does not match the declared checksum");
            }
        } catch (IOException e) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Cannot read the bundle artifact for checksum verification");
        } catch (NoSuchAlgorithmException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_ARTIFACT_CHECKSUM_MISMATCH,
                    "SHA-256 is unavailable");
        }
    }

    private String resolveHost(String source, String imageRef, String registryUrl) {
        String type = source == null ? "" : source.trim().toUpperCase(Locale.ROOT);
        if ("IMAGE_REGISTRY".equals(type)) {
            return hostFromUrl(registryUrl);
        }
        if ("DOCKER_HUB".equals(type)) {
            if (imageRef != null && !imageRef.isBlank()) {
                String first = imageRef.trim().split("/")[0];
                if (first.contains(".") || first.contains(":") || first.equalsIgnoreCase("localhost")) {
                    return first;
                }
            }
            return DOCKER_HUB_HOST;
        }
        return null;
    }

    private String hostFromUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        try {
            String normalized = url.trim();
            if (!normalized.contains("://")) {
                normalized = "https://" + normalized;
            }
            URI uri = URI.create(normalized);
            if (!"https".equalsIgnoreCase(uri.getScheme()) && !"http".equalsIgnoreCase(uri.getScheme())) {
                throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID,
                        "Registry URL must use http(s)");
            }
            return uri.getHost();
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID,
                    "Registry URL is malformed");
        }
    }

    private Set<String> allowlist() {
        String hosts = allowedHosts.orElse(null);
        if (hosts == null || hosts.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(hosts.split(","))
                .map(host -> host.trim().toLowerCase(Locale.ROOT))
                .filter(host -> !host.isBlank())
                .collect(Collectors.toSet());
    }

    private boolean isPrivateHost(String host) {
        if (host.equals("localhost") || host.equals("::1") || host.endsWith(".local")
                || host.endsWith(".internal")) {
            return true;
        }
        if (host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.")
                || host.startsWith("169.254.")) {
            return true;
        }
        if (host.startsWith("172.")) {
            String[] parts = host.split("\\.");
            if (parts.length > 1) {
                try {
                    int second = Integer.parseInt(parts[1]);
                    return second >= 16 && second <= 31;
                } catch (NumberFormatException ignored) {
                    return false;
                }
            }
        }
        return false;
    }

    private String toHex(byte[] bytes) {
        return HexFormat.of().formatHex(bytes);
    }
}
