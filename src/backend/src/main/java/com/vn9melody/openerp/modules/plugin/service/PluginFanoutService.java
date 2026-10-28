package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
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
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Generic system-catalog fan-out (ADR-S05-001 A6.3): read the canonical
 * snapshot from the system tenant's catalog plugin and apply it to every active
 * tenant plugin instance. Core only orchestrates; it never reads catalog tables.
 */
@ApplicationScoped
public class PluginFanoutService {

    private static final Logger LOG = Logger.getLogger(PluginFanoutService.class);

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginRuntimeGatewayService gatewayService;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "openerp.platform.system-tenant-id",
        defaultValue = "00000000-0000-0000-0000-000000000001")
    String systemTenantId;

    @ConfigProperty(name = "openerp.plugin.fanout.token", defaultValue = "")
    String fanoutToken;

    @ConfigProperty(name = "openerp.plugin.fanout.timeout-seconds", defaultValue = "60")
    int timeoutSeconds;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    public JsonNode fanoutCatalog() {
        UUID systemTenant = UUID.fromString(systemTenantId);
        TenantPlugin system = tenantPluginRepository.findByTenantAndKey(systemTenant, "catalog")
            .orElseThrow(() -> new ApiException(404, PluginErrorCode.PLUGIN_NOT_INSTALLED,
                "System tenant catalog plugin is not installed"));
        if (system.status != TenantPluginStatus.ACTIVE) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_NOT_INSTALLED,
                "System tenant catalog plugin is not active");
        }

        JsonNode snapshot = get(system, "/internal/system-catalog/snapshot").path("data");
        if (!snapshot.has("types")) {
            throw new ApiException(502, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                "Catalog snapshot response has no data");
        }
        List<TenantPlugin> targets = tenantPluginRepository.list("pluginKey = ?1 and status = ?2",
            "catalog", TenantPluginStatus.ACTIVE);

        ObjectNode result = objectMapper.createObjectNode();
        int synced = 0;
        int failed = 0;
        ArrayNode results = result.putArray("results");
        for (TenantPlugin target : targets) {
            if (target.tenantId.equals(systemTenant)) {
                continue;
            }
            ObjectNode row = results.addObject();
            row.put("tenant_id", target.tenantId.toString());
            try {
                JsonNode applied = post(target, "/internal/system-catalog/sync", snapshot);
                row.put("status", "SYNCED");
                row.set("counts", applied.path("data"));
                synced++;
            } catch (RuntimeException e) {
                row.put("status", "FAILED");
                row.put("error", e.getMessage());
                failed++;
                LOG.warnf("Catalog fan-out failed for tenant %s: %s", target.tenantId, e.getMessage());
            }
        }
        result.put("total", synced + failed);
        result.put("synced", synced);
        result.put("failed", failed);
        return result;
    }

    private JsonNode get(TenantPlugin ledger, String path) {
        HttpRequest request = request(ledger, path).GET().build();
        return send(request);
    }

    private JsonNode post(TenantPlugin ledger, String path, JsonNode body) {
        try {
            HttpRequest request = request(ledger, path)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
            return send(request);
        } catch (IOException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                "Cannot serialize catalog snapshot");
        }
    }

    private HttpRequest.Builder request(TenantPlugin ledger, String path) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(gatewayService.baseUrl(ledger) + path))
            .timeout(Duration.ofSeconds(timeoutSeconds))
            .header("Accept", "application/json");
        if (fanoutToken != null && !fanoutToken.isBlank()) {
            builder.header("X-Plugin-Fanout-Token", fanoutToken);
        }
        return builder;
    }

    private JsonNode send(HttpRequest request) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(502, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                    "Catalog plugin fan-out HTTP " + response.statusCode());
            }
            return objectMapper.readTree(response.body());
        } catch (IOException e) {
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                "Catalog plugin fan-out unreachable: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                "Catalog plugin fan-out interrupted");
        }
    }
}
