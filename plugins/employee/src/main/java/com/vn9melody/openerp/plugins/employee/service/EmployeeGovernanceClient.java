package com.vn9melody.openerp.plugins.employee.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.employee.api.EmployeeErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * TASK-431: asks Core whether the linked user may be offboarded. The employee
 * plugin has no access to Core IAM tables, so the decision stays in Core.
 * Failure is fail-closed: an unavailable Core never permits removing access.
 */
@ApplicationScoped
public class EmployeeGovernanceClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    @ConfigProperty(name = "openerp.core.url")
    Optional<String> coreUrl;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    TenantContext tenantContext;

    public record Decision(
        boolean lastOwner,
        boolean lastAdmin,
        boolean platformRole,
        long ownerCount,
        long adminCount,
        List<String> platformRoles
    ) {
    }

    public Decision check(UUID userId) {
        String base = coreUrl.map(value -> value.replaceAll("/$", "")).orElse("");
        String token = tenantContext.serviceToken();
        if (base.isBlank() || token == null || token.isBlank()) {
            throw unavailable("Core URL or plugin service token is missing");
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(base + "/api/v1/internal/employees/" + userId + "/offboarding-check"))
                .timeout(TIMEOUT)
                .header("X-Plugin-Service-Token", token)
                .header("Accept", "application/json")
                .GET()
                .build();
            HttpResponse<String> response = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .build()
                .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw unavailable("Core governance check returned HTTP " + response.statusCode());
            }
            return parse(objectMapper.readTree(response.body()));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw unavailable("Core governance check failed: " + e.getMessage());
        }
    }

    static Decision parse(JsonNode root) {
        JsonNode data = root == null ? null : root.path("data");
        if (data == null || data.isMissingNode() || !data.path("last_owner").isBoolean()) {
            throw unavailable("Core governance response is invalid");
        }
        List<String> roles = new ArrayList<>();
        for (JsonNode role : data.path("platform_roles")) {
            roles.add(role.asText());
        }
        return new Decision(
            data.path("last_owner").asBoolean(),
            data.path("last_admin").asBoolean(),
            data.path("platform_role").asBoolean(),
            data.path("owner_count").asLong(),
            data.path("admin_count").asLong(),
            roles);
    }

    private static ApiException unavailable(String message) {
        return new ApiException(503, EmployeeErrorCode.EMPLOYEE_GOVERNANCE_CHECK_UNAVAILABLE,
            message, Map.of());
    }
}
