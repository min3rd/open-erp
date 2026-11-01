package com.vn9melody.openerp.plugins.employee.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Best-effort in-app notification for onboarding invites. Core resolves whether
 * the email belongs to an active tenant user and forwards to the notification
 * plugin; an unavailable channel never blocks creating the invite.
 */
@ApplicationScoped
public class OnboardingNotificationClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    @ConfigProperty(name = "openerp.core.url")
    Optional<String> coreUrl;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    TenantContext tenantContext;

    public record Result(boolean notified, String reason) {
    }

    public Result notify(String email, String inviteLink, Instant expiresAt) {
        String base = coreUrl.map(value -> value.replaceAll("/$", "")).orElse("");
        String token = tenantContext.serviceToken();
        if (base.isBlank() || token == null || token.isBlank()) {
            return new Result(false, "CORE_URL_OR_TOKEN_MISSING");
        }
        try {
            Map<String, Object> body = Map.of(
                "email", email,
                "invite_link", inviteLink,
                "expires_at", expiresAt == null ? "" : expiresAt.toString(),
                "title", "Lời mời hoàn thiện hồ sơ nhân viên",
                "body", "Bạn được mời hoàn thiện hồ sơ nhân viên. Mở liên kết sau: " + inviteLink
            );
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(base + "/api/v1/internal/notifications/onboarding-invite"))
                .timeout(TIMEOUT)
                .header("X-Plugin-Service-Token", token)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();
            HttpResponse<String> response = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .build()
                .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return new Result(false, "HTTP_" + response.statusCode());
            }
            JsonNode data = objectMapper.readTree(response.body()).path("data");
            return new Result(data.path("notified").asBoolean(false),
                data.path("reason").isMissingNode() ? null : data.path("reason").asText(null));
        } catch (Exception e) {
            return new Result(false, "NOTIFICATION_UNAVAILABLE");
        }
    }
}
