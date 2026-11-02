package com.vn9melody.openerp.plugins.form.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Client for the Core Entity Write Proxy (ADR-S08-002 §2.2): form responses
 * mapped to another plugin's entity go through Core, never directly to the
 * target plugin's tables. Best-effort: a failed write is reported back to the
 * caller so the response is still stored (entity_write_status=FAILED, AC-F04).
 */
@ApplicationScoped
public class EntityWriteProxyClient {

    private static final Logger LOG = Logger.getLogger(EntityWriteProxyClient.class);

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "plugin.core.internal-url", defaultValue = "http://backend-dev:8088")
    String coreInternalUrl;

    @Inject
    @ConfigProperty(name = "plugin.data.service-token", defaultValue = "")
    java.util.Optional<String> serviceToken;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public record WriteResult(boolean ok, Object response, String error) {}

    public WriteResult write(String targetPlugin, String entityName,
            Map<String, Object> record, String idempotencyKey) {
        if (serviceToken == null || serviceToken.isEmpty()) {
            return new WriteResult(false, null, "NO_SERVICE_TOKEN");
        }
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(coreInternalUrl
                            + "/api/v1/internal/entity-write/" + targetPlugin))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .header("X-Plugin-Service-Token", serviceToken.orElse(""))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(Map.of(
                            "entity_name", entityName,
                            "record", record,
                            "idempotency_key", idempotencyKey))))
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode body = objectMapper.readTree(response.body());
                return new WriteResult(true, body.path("data"), null);
            }
            return new WriteResult(false, null, "HTTP_" + response.statusCode());
        } catch (Exception e) {
            LOG.warnf("Entity write to %s.%s failed: %s", targetPlugin, entityName, e.getMessage());
            return new WriteResult(false, null, "TARGET_UNAVAILABLE");
        }
    }
}
