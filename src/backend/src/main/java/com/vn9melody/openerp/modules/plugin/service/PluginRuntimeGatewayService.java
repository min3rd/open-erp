package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Runtime gateway (TASK-340): proxies tenant requests to the plugin container
 * of an ACTIVE installation. Only internal network URLs are produced by the
 * deployer, so no user-supplied URL is ever dialed.
 */
@ApplicationScoped
public class PluginRuntimeGatewayService {

    private static final Logger LOG = Logger.getLogger(PluginRuntimeGatewayService.class);
    private static final int MAX_BODY_BYTES = 10 * 1024 * 1024;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @ConfigProperty(name = "openerp.plugin.deployer.namespace", defaultValue = "default")
    String namespace;

    @ConfigProperty(name = "openerp.plugin.gateway.timeout-seconds", defaultValue = "30")
    int timeoutSeconds;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public record GatewayResponse(int status, String contentType, byte[] body) {}

    public GatewayResponse forward(UUID tenantId, UUID userId, String pluginKey, String method, String path,
                                   String query, String contentType, byte[] body) {
        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey)
                .orElseThrow(() -> new ApiException(403, PluginErrorCode.PLUGIN_DISABLED_FOR_TENANT,
                        "Plugin is not enabled for this tenant"));
        if (ledger.status != TenantPluginStatus.ACTIVE) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_DISABLED_FOR_TENANT,
                    "Plugin is not active for this tenant");
        }
        if (body != null && body.length > MAX_BODY_BYTES) {
            throw new ApiException(413, PluginErrorCode.PLUGIN_RUNTIME_REQUEST_TOO_LARGE,
                    "Request body exceeds the gateway limit");
        }
        String target = runtimeBaseUrl(ledger) + normalizePath(path)
                + (query == null || query.isBlank() ? "" : "?" + query);
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(target))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("X-Tenant-Id", tenantId.toString())
                .header("X-User-Id", userId == null ? "" : userId.toString())
                .header("X-Plugin-Key", pluginKey);
        if (contentType != null && !contentType.isBlank()) {
            builder.header("Content-Type", contentType);
        }
        builder.method(method, body == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofByteArray(body));
        try {
            HttpResponse<byte[]> response = httpClient.send(builder.build(),
                    HttpResponse.BodyHandlers.ofByteArray());
            String responseType = response.headers().firstValue("Content-Type").orElse(null);
            return new GatewayResponse(response.statusCode(), responseType, response.body());
        } catch (IOException e) {
            LOG.warnf("Plugin runtime unreachable for %s/%s: %s", tenantId, pluginKey, e.getMessage());
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                    "Plugin runtime is unavailable");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                    "Plugin runtime request interrupted");
        }
    }

    private String runtimeBaseUrl(TenantPlugin ledger) {
        JsonNode ref = ledger.deployRef;
        if (ref == null || ref.isMissingNode() || ref.path("deployment").asText("").isBlank()) {
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                    "Plugin runtime has no deployment reference");
        }
        String runtime = ref.path("runtime").asText("docker");
        String service = ref.path("service").asText(ref.path("deployment").asText());
        if ("docker".equalsIgnoreCase(runtime)) {
            return "http://" + service + ":8080";
        }
        if ("kubernetes".equalsIgnoreCase(runtime)) {
            return "http://" + service + "." + namespace + ".svc.cluster.local:8080";
        }
        throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                "Runtime '" + runtime + "' cannot be proxied");
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank()) {
            return "/";
        }
        return path.startsWith("/") ? path : "/" + path;
    }
}
