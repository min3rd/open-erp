package com.vn9melody.openerp.plugin.sdk.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Best-effort publisher to the Core Plugin Event Hub (Sprint 08, ADR-S08-002).
 * Publishing MUST NOT break the business action that produced the event: a
 * failed publish is logged and dropped (the relay retries deliveries, not
 * publishes). Plugins declare their publications in plugin.json.
 */
@ApplicationScoped
public class PluginEventPublisher {

    private static final Logger LOG = Logger.getLogger(PluginEventPublisher.class);

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "plugin.core.internal-url", defaultValue = "http://backend-dev:8088")
    String coreInternalUrl;

    @Inject
    @ConfigProperty(name = "plugin.data.service-token", defaultValue = "")
    java.util.Optional<String> serviceToken;

    @Inject
    @ConfigProperty(name = "plugin.fanout.token", defaultValue = "")
    java.util.Optional<String> fanoutToken;

    @Inject
    com.vn9melody.openerp.plugin.sdk.runtime.TenantContext tenantContext;

    @ConfigProperty(name = "plugin.key", defaultValue = "")
    String pluginKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /** Returns true when Core accepted a NEW event; false on duplicate/skip/failure. */
    public boolean publish(String eventType, String entity, String aggregateId,
            Object payload, String idempotencyKey) {
        if (eventType == null || eventType.isBlank()) {
            return false;
        }
        if ((serviceToken == null || serviceToken.isEmpty())
                && (fanoutToken == null || fanoutToken.isEmpty())) {
            LOG.debugf("Event %s skipped: no service or fanout token configured", eventType);
            return false;
        }
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("event", eventType);
            body.put("entity", entity);
            body.put("aggregate_id", aggregateId == null ? "" : aggregateId);
            body.put("payload", payload == null ? Map.of() : payload);
            body.put("idempotency_key", idempotencyKey == null || idempotencyKey.isBlank()
                    ? UUID.randomUUID().toString()
                    : idempotencyKey);
            HttpRequest request = HttpRequest.newBuilder(
                            URI.create(coreInternalUrl + "/api/v1/internal/plugin-events"))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("X-Plugin-Service-Token", serviceToken.orElse(""))
                    .header("X-Plugin-Fanout-Token", fanoutToken.orElse(""))
                    .header("X-Plugin-Key", pluginKey == null ? "" : pluginKey)
                    .header("X-Tenant-Id", tenantContext.tenantId() == null
                            ? "" : tenantContext.tenantId().toString())
                    .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return true;
            }
            LOG.warnf("Event %s publish rejected (HTTP %d)", eventType, response.statusCode());
            return false;
        } catch (Exception e) {
            LOG.warnf("Event %s publish failed: %s", eventType, e.getMessage());
            return false;
        }
    }
}
