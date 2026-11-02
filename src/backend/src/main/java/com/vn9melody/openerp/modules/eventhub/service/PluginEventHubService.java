package com.vn9melody.openerp.modules.eventhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.modules.eventhub.model.PluginEvent;
import com.vn9melody.openerp.modules.eventhub.model.PluginEventDelivery;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginRuntimeGatewayService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.jboss.logging.Logger;

/**
 * Sprint 08 / ADR-S08-002. Plugins publish events idempotently; the relay
 * matches each event against the {@code event_subscriptions} declared in the
 * manifest of every plugin version installed ACTIVE for the tenant and delivers
 * via the runtime gateway with a short-lived service identity. No plugin reads
 * another plugin's tables — cross-plugin data flows only through this hub.
 */
@ApplicationScoped
public class PluginEventHubService {

    private static final Logger LOG = Logger.getLogger(PluginEventHubService.class);
    private static final int MAX_EVENTS_PER_PASS = 50;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginRuntimeGatewayService gatewayService;

    private final Map<String, Optional<JsonNode>> subscriptionCache = new ConcurrentHashMap<>();

    public record PublishResult(UUID eventId, boolean created) {}

    /** Idempotent publish: duplicate idempotency_key returns the original event. */
    public PublishResult publish(UUID tenantId, String sourcePlugin, String eventType,
            String entity, String aggregateId, Object payload, String idempotencyKey) {
        PluginEvent existing = PluginEvent.find("idempotencyKey", idempotencyKey).firstResult();
        if (existing != null) {
            return new PublishResult(existing.id, false);
        }
        try {
            PluginEvent event = new PluginEvent();
            event.tenantId = tenantId;
            event.sourcePlugin = sourcePlugin;
            event.eventType = eventType;
            event.entity = entity;
            event.aggregateId = aggregateId;
            event.payload = payload == null ? "{}"
                    : objectMapper.writeValueAsString(payload);
            event.idempotencyKey = idempotencyKey;
            event.persist();
            return new PublishResult(event.id, true);
        } catch (PersistenceException e) {
            PluginEvent raced = PluginEvent.find("idempotencyKey", idempotencyKey).firstResult();
            return new PublishResult(raced != null ? raced.id : null, false);
        } catch (Exception e) {
            LOG.errorf("Event publish failed: %s", e.getMessage());
            return new PublishResult(null, false);
        }
    }

    /** One relay pass: schedule deliveries for pending events, then deliver due ones. */
    public int relayPending() {
        int processed = 0;
        for (PluginEvent event : pendingEvents()) {
            processed++;
            if (event.processedAt != null) {
                continue;
            }
            List<String> targets = resolveSubscribers(event.tenantId, event);
            if (targets.isEmpty()) {
                event.processedAt = OffsetDateTime.now();
                continue;
            }
            boolean allSettled = true;
            for (String target : targets) {
                String settled = deliverOrSchedule(event, target);
                if (!"DELIVERED".equals(settled) && !"FAILED".equals(settled)) {
                    allSettled = false;
                }
            }
            if (allSettled) {
                event.processedAt = OffsetDateTime.now();
            }
        }
        return processed;
    }

    private List<PluginEvent> pendingEvents() {
        return PluginEvent.find("processedAt is null order by createdAt asc")
                .page(0, MAX_EVENTS_PER_PASS)
                .list();
    }

    private List<String> resolveSubscribers(UUID tenantId, PluginEvent event) {
        List<String> targets = new ArrayList<>();
        for (TenantPlugin ledger : tenantPluginRepository.listActiveByTenant(tenantId)) {
            if (ledger.pluginKey.equals(event.sourcePlugin)) {
                continue;
            }
            Optional<JsonNode> subscriptions = subscriptionsOf(ledger);
            if (subscriptions.isEmpty()) {
                continue;
            }
            for (JsonNode sub : subscriptions.get()) {
                String source = sub.path("source").asText("*");
                String type = sub.path("event").asText("*");
                String entity = sub.path("entity").asText("*");
                boolean matches = ("*".equals(source) || source.equals(event.sourcePlugin))
                        && ("*".equals(type) || type.equals(event.eventType))
                        && ("*".equals(entity) || event.entity == null || entity.equals(event.entity));
                if (matches) {
                    targets.add(ledger.pluginKey);
                    break;
                }
            }
        }
        return targets;
    }

    /** Subscriptions are manifest-driven; per-tenant filtering stays inside the subscriber. */
    private Optional<JsonNode> subscriptionsOf(TenantPlugin ledger) {
        String cacheKey = ledger.pluginKey + "@" + ledger.installedVersion;
        return subscriptionCache.computeIfAbsent(cacheKey, key -> {
            PluginCatalog catalog = catalogRepository.findById(ledger.catalogId);
            if (catalog == null) {
                return Optional.empty();
            }
            return versionRepository
                    .findByCatalogAndVersion(catalog.id, ledger.installedVersion)
                    .map(version -> {
                        JsonNode manifest = version.manifest;
                        JsonNode subs = manifest == null ? null : manifest.path("event_subscriptions");
                        return subs != null && subs.isArray() && !subs.isEmpty() ? subs : null;
                    })
                    .filter(subs -> subs != null);
        });
    }

    /** Returns the delivery status after this pass; PENDING means retry later. */
    private String deliverOrSchedule(PluginEvent event, String target) {
        PluginEventDelivery delivery = PluginEventDelivery.find(
                        "eventId = ?1 and targetPlugin = ?2", event.id, target)
                .firstResult();
        if (delivery == null) {
            delivery = new PluginEventDelivery();
            delivery.eventId = event.id;
            delivery.tenantId = event.tenantId;
            delivery.targetPlugin = target;
            delivery.nextRetryAt = OffsetDateTime.now();
            delivery.persist();
        }
        if (!PluginEventDelivery.STATUS_PENDING.equals(delivery.status)) {
            return delivery.status;
        }
        if (delivery.nextRetryAt != null && delivery.nextRetryAt.isAfter(OffsetDateTime.now())) {
            return delivery.status;
        }
        try {
            byte[] body = objectMapper.writeValueAsBytes(Map.of(
                    "event_delivery_id", delivery.id.toString(),
                    "event", event.eventType,
                    "source_plugin", event.sourcePlugin,
                    "entity", event.entity == null ? "" : event.entity,
                    "aggregate_id", event.aggregateId == null ? "" : event.aggregateId,
                    "payload", objectMapper.readTree(
                            event.payload == null ? "{}" : event.payload)));
            PluginRuntimeGatewayService.GatewayResponse response = gatewayService.forward(
                    event.tenantId, null, Set.of(), Set.of(), Set.of(),
                    target, null, "POST", "/api/v1/" + target + "/internal-events", null,
                    "application/json", body);
            if (response.status() >= 200 && response.status() < 300) {
                delivery.status = PluginEventDelivery.STATUS_DELIVERED;
                delivery.deliveredAt = OffsetDateTime.now();
                return delivery.status;
            }
            return scheduleRetry(delivery, "HTTP " + response.status());
        } catch (Exception e) {
            return scheduleRetry(delivery, e.getMessage() == null ? "delivery failed" : e.getMessage());
        }
    }

    private String scheduleRetry(PluginEventDelivery delivery, String error) {
        delivery.attempts++;
        delivery.lastError = error == null ? "delivery failed" : error;
        if (delivery.attempts >= PluginEventDelivery.MAX_ATTEMPTS) {
            delivery.status = PluginEventDelivery.STATUS_FAILED;
            LOG.warnf("Event delivery to %s permanently failed after %d attempts: %s",
                    delivery.targetPlugin, delivery.attempts, error);
        } else {
            long backoff = PluginEventDelivery.BASE_BACKOFF_SECONDS * (1L << Math.min(delivery.attempts, 4));
            delivery.nextRetryAt = OffsetDateTime.now().plusSeconds(backoff);
        }
        return delivery.status;
    }
}
