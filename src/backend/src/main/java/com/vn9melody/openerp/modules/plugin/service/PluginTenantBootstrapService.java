package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.deployer.ProcessPluginRuntimeDeployer;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Status;
import jakarta.transaction.Synchronization;
import jakarta.transaction.TransactionSynchronizationRegistry;
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
 * Bootstraps per-tenant plugin data in a shared version container. The
 * container is shared by every tenant on the same plugin version, so tenant
 * seeders cannot run at container start; the core calls the plugin's internal
 * bootstrap endpoint with the tenant identity and a short-lived service token.
 *
 * <p>The call is deferred until the lifecycle transaction commits: the data
 * gateway only serves an ACTIVE plugin ledger, and the ledger row must be
 * visible with its committed storage schema.</p>
 */
@ApplicationScoped
public class PluginTenantBootstrapService {

    private static final Logger LOG = Logger.getLogger(PluginTenantBootstrapService.class);

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    TransactionSynchronizationRegistry transactions;

    @ConfigProperty(name = "openerp.plugin.deployer.namespace", defaultValue = "default")
    String namespace;

    @ConfigProperty(name = "openerp.plugin.bootstrap.timeout-seconds", defaultValue = "120")
    int timeoutSeconds;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public void bootstrap(ProcessPluginRuntimeDeployer.DeploymentRef ref, UUID tenantId,
                          String pluginKey, boolean system) {
        if (ref == null) {
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                    "Plugin runtime has no deployment reference");
        }
        if ("noop".equalsIgnoreCase(ref.runtime())) {
            return;
        }
        if (transactions.getTransactionStatus() == Status.STATUS_NO_TRANSACTION) {
            call(ref, tenantId, pluginKey, system);
            return;
        }
        transactions.registerInterposedSynchronization(new Synchronization() {
            @Override
            public void beforeCompletion() {
                // no-op
            }

            @Override
            public void afterCompletion(int status) {
                if (status != Status.STATUS_COMMITTED) {
                    return;
                }
                try {
                    TenantPlugin ledger = tenantPluginRepository
                            .findByTenantAndKey(tenantId, pluginKey).orElse(null);
                    if (ledger == null || ledger.status != TenantPluginStatus.ACTIVE) {
                        return;
                    }
                    String service = ledger.deployRef.path("service").asText("");
                    if (!ref.service().equals(service)) {
                        return;
                    }
                    call(new ProcessPluginRuntimeDeployer.DeploymentRef(ledger.deployRef.path("runtime").asText(""),
                            ledger.deployRef.path("deployment").asText(""), service, true),
                            tenantId, pluginKey, system);
                } catch (RuntimeException e) {
                    LOG.errorf("Plugin tenant bootstrap failed for %s/%s: %s", tenantId, pluginKey, e.getMessage());
                }
            }
        });
    }

    private void call(ProcessPluginRuntimeDeployer.DeploymentRef ref, UUID tenantId,
                      String pluginKey, boolean system) {
        String baseUrl = "docker".equalsIgnoreCase(ref.runtime())
                ? "http://" + ref.service() + ":8080"
                : "http://" + ref.service() + "." + namespace + ".svc.cluster.local:8080";
        String token = jwtTokenService.generatePluginServiceToken(tenantId, pluginKey,
                system ? "SYSTEM" : "TENANT", Duration.ofMinutes(10));
        HttpRequest request = HttpRequest.newBuilder(
                        URI.create(baseUrl + "/internal/tenant/bootstrap"))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "application/json")
                .header("X-Tenant-Id", tenantId.toString())
                .header("X-Plugin-Service-Token", token)
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                LOG.debugf("Plugin %s has no tenant bootstrap endpoint", pluginKey);
                return;
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(503, PluginErrorCode.PLUGIN_SERVICE_UNHEALTHY,
                        "Plugin tenant bootstrap failed with HTTP " + response.statusCode());
            }
        } catch (IOException e) {
            LOG.warnf("Plugin tenant bootstrap unreachable for %s/%s: %s", tenantId, pluginKey, e.getMessage());
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                    "Plugin tenant bootstrap is unavailable");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(503, PluginErrorCode.PLUGIN_RUNTIME_UNAVAILABLE,
                    "Plugin tenant bootstrap interrupted");
        }
    }
}
