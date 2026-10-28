package com.vn9melody.openerp.plugin.sdk.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.ListValue;
import com.google.protobuf.NullValue;
import com.google.protobuf.Struct;
import com.google.protobuf.Value;
import com.google.protobuf.util.JsonFormat;
import com.vn9melody.openerp.plugin.data.v1.ExecuteBatchRequest;
import com.vn9melody.openerp.plugin.data.v1.ExecuteBatchResponse;
import com.vn9melody.openerp.plugin.data.v1.ExecuteRequest;
import com.vn9melody.openerp.plugin.data.v1.ExecuteResponse;
import com.vn9melody.openerp.plugin.data.v1.PluginDataServiceGrpc;
import com.vn9melody.openerp.plugin.data.v1.Row;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import io.grpc.ManagedChannel;
import io.grpc.Metadata;
import io.grpc.StatusRuntimeException;
import io.grpc.netty.shaded.io.grpc.netty.GrpcSslContexts;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import io.grpc.netty.shaded.io.netty.handler.ssl.SslContext;
import io.grpc.stub.MetadataUtils;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.ContextNotActiveException;
import jakarta.inject.Inject;
import java.io.File;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Client for the core Plugin Data Gateway (SOL-S05-002). Plugins keep their
 * REST API and business logic; every database read/write goes through a named
 * query descriptor over gRPC + mTLS + service token.
 */
@ApplicationScoped
public class PluginDataClient {

    private static final Logger LOG = Logger.getLogger(PluginDataClient.class);
    private static final Metadata.Key<String> SERVICE_TOKEN =
            Metadata.Key.of("x-service-token", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> PLUGIN_KEY =
            Metadata.Key.of("x-plugin-key", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> TENANT_ID =
            Metadata.Key.of("x-tenant-id", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> SCOPE =
            Metadata.Key.of("x-scope", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> ERROR_CODE =
            Metadata.Key.of("x-error-code", Metadata.ASCII_STRING_MARSHALLER);

    @Inject
    TenantContext tenantContext;

    @ConfigProperty(name = "plugin.data.gateway-url")
    java.util.Optional<String> gatewayUrl;

    @ConfigProperty(name = "plugin.data.service-token")
    java.util.Optional<String> serviceToken;

    @ConfigProperty(name = "plugin.data.tls-ca")
    java.util.Optional<String> tlsCa;

    @ConfigProperty(name = "plugin.data.tls-cert")
    java.util.Optional<String> tlsCert;

    @ConfigProperty(name = "plugin.data.tls-key")
    java.util.Optional<String> tlsKey;

    @ConfigProperty(name = "plugin.data.deadline-ms", defaultValue = "3000")
    long deadlineMs;

    @ConfigProperty(name = "plugin.key", defaultValue = "catalog")
    String pluginKey;

    @ConfigProperty(name = "plugin.scope", defaultValue = "tenant")
    String pluginScope;

    @ConfigProperty(name = "plugin.tenant-id")
    java.util.Optional<String> tenantIdConfig;

    private volatile ManagedChannel channel;

    public PluginQueryResult query(String queryId, Map<String, ?> params) {
        return query(queryId, params, false, null);
    }

    public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary) {
        return query(queryId, params, primary, null);
    }

    /** WRITE call with an auto-generated idempotency key. */
    public PluginQueryResult write(String queryId, Map<String, ?> params) {
        return query(queryId, params, false, UUID.randomUUID().toString());
    }

    public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary,
                                   String idempotencyKey) {
        if (gatewayUrl.isEmpty() || gatewayUrl.get().isBlank()) {
            throw new ApiException(503, ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE,
                    "Plugin data gateway is not configured", Map.of());
        }
        ExecuteRequest.Builder request = ExecuteRequest.newBuilder()
                .setQueryId(queryId)
                .setRequestId(UUID.randomUUID().toString())
                .setPrimary(primary);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            request.setIdempotencyKey(idempotencyKey);
        }
        if (params != null) {
            params.forEach((key, value) -> request.putParams(key, toValue(value)));
        }
        try {
            ExecuteResponse response = stub().execute(request.build());
            return new PluginQueryResult(rows(response), response.getTotalRows(), response.getAffectedRows());
        } catch (StatusRuntimeException e) {
            throw mapError(queryId, e);
        }
    }

    public record BatchStatement(String queryId, Map<String, ?> params) {}

    public List<PluginQueryResult> executeBatch(List<BatchStatement> statements) {
        return executeBatch(statements, UUID.randomUUID().toString());
    }

    public List<PluginQueryResult> executeBatch(List<BatchStatement> statements, String idempotencyKey) {
        if (gatewayUrl.isEmpty() || gatewayUrl.get().isBlank()) {
            throw new ApiException(503, ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE,
                    "Plugin data gateway is not configured", Map.of());
        }
        ExecuteBatchRequest.Builder request = ExecuteBatchRequest.newBuilder()
                .setRequestId(UUID.randomUUID().toString());
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            request.setIdempotencyKey(idempotencyKey);
        }
        for (BatchStatement statement : statements) {
            ExecuteRequest.Builder item = ExecuteRequest.newBuilder()
                    .setQueryId(statement.queryId())
                    .setRequestId(UUID.randomUUID().toString());
            if (statement.params() != null) {
                statement.params().forEach((key, value) -> item.putParams(key, toValue(value)));
            }
            request.addStatements(item);        }
        try {
            ExecuteBatchResponse response = stub().executeBatch(request.build());
            return response.getStatementsList().stream()
                    .map(item -> new PluginQueryResult(rows(item), item.getTotalRows(), item.getAffectedRows()))
                    .toList();
        } catch (StatusRuntimeException e) {
            throw mapError("__batch__", e);
        }
    }

    private PluginDataServiceGrpc.PluginDataServiceBlockingStub stub() {
        Metadata metadata = metadata();
        return PluginDataServiceGrpc.newBlockingStub(channel())
                .withInterceptors(MetadataUtils.newAttachHeadersInterceptor(metadata))
                .withDeadlineAfter(deadlineMs, TimeUnit.MILLISECONDS);
    }

    private Metadata metadata() {
        Metadata metadata = new Metadata();
        if (serviceToken.isPresent() && !serviceToken.get().isBlank()) {
            metadata.put(SERVICE_TOKEN, serviceToken.get());
            return metadata;
        }
        UUID tenantId = currentTenant();
        if (tenantId == null && tenantIdConfig.isPresent() && !tenantIdConfig.get().isBlank()) {
            tenantId = UUID.fromString(tenantIdConfig.get().trim());
        }
        if (tenantId == null) {
            throw new ApiException(401, ErrorCode.PLUGIN_DATA_FORBIDDEN,
                    "Plugin data gateway requires a tenant context", Map.of());
        }
        metadata.put(PLUGIN_KEY, pluginKey);
        metadata.put(TENANT_ID, tenantId.toString());
        metadata.put(SCOPE, "platform".equalsIgnoreCase(pluginScope) ? "SYSTEM" : "TENANT");
        return metadata;
    }

    /** TenantContext is request scoped; startup tasks only have the configured tenant. */
    private UUID currentTenant() {
        try {
            return tenantContext.tenantId();
        } catch (ContextNotActiveException e) {
            return null;
        }
    }

    private ManagedChannel channel() {
        ManagedChannel current = channel;
        if (current != null) {
            return current;
        }
        synchronized (this) {
            if (channel == null) {
                channel = buildChannel();
            }
            return channel;
        }
    }

    private ManagedChannel buildChannel() {
        URI uri = URI.create(gatewayUrl.get().trim());
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new ApiException(503, ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE,
                    "Plugin data gateway URL is invalid", Map.of());
        }
        boolean tls = "https".equalsIgnoreCase(uri.getScheme());
        int port = uri.getPort() > 0 ? uri.getPort() : (tls ? 443 : 9090);
        NettyChannelBuilder builder = NettyChannelBuilder.forAddress(host, port);
        if (tls) {
            if (tlsCa.isEmpty() || tlsCert.isEmpty() || tlsKey.isEmpty()
                    || tlsCa.get().isBlank() || tlsCert.get().isBlank() || tlsKey.get().isBlank()) {
                throw new ApiException(503, ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE,
                        "Plugin data gateway mTLS files are not configured", Map.of());
            }
            try {
                SslContext ssl = GrpcSslContexts.forClient()
                        .trustManager(new File(tlsCa.get()))
                        .keyManager(new File(tlsCert.get()), new File(tlsKey.get()))
                        .build();
                builder.sslContext(ssl);
            } catch (Exception e) {
                throw new ApiException(503, ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE,
                        "Cannot initialize plugin data gateway TLS", Map.of());
            }
        } else {
            builder.usePlaintext();
        }
        return builder.build();
    }

    private ApiException mapError(String queryId, StatusRuntimeException error) {
        String code = ErrorCode.PLUGIN_DATA_REQUEST_FAILED;
        int status = 500;
        switch (error.getStatus().getCode()) {
            case PERMISSION_DENIED, UNAUTHENTICATED -> {
                code = ErrorCode.PLUGIN_DATA_FORBIDDEN;
                status = 403;
            }
            case INVALID_ARGUMENT -> {
                code = ErrorCode.PLUGIN_DATA_REQUEST_FAILED;
                status = 400;
            }
            case UNAVAILABLE, DEADLINE_EXCEEDED -> {
                code = ErrorCode.PLUGIN_DATA_GATEWAY_UNAVAILABLE;
                status = 503;
            }
            case ALREADY_EXISTS, ABORTED -> status = 409;
            default -> {
                // keep the generic error code
            }
        }
        Metadata trailers = error.getTrailers();
        if (trailers != null) {
            String remote = trailers.get(ERROR_CODE);
            if (remote != null && !remote.isBlank()) {
                code = remote;
            }
        }
        LOG.warnf("Plugin data gateway call failed query=%s status=%s code=%s",
                queryId, error.getStatus().getCode(), code);
        return new ApiException(status, code, "Plugin data gateway request failed",
                Map.of("query_id", queryId));
    }

    private List<Map<String, Object>> rows(ExecuteResponse response) {
        List<Map<String, Object>> rows = new ArrayList<>(response.getRowsCount());
        for (Row row : response.getRowsList()) {
            Map<String, Object> values = new LinkedHashMap<>();
            row.getValuesMap().forEach((key, value) -> values.put(key, fromValue(value)));
            rows.add(values);
        }
        return rows;
    }

    private static Value toValue(Object raw) {
        if (raw == null) {
            return Value.newBuilder().setNullValue(NullValue.NULL_VALUE).build();
        }
        if (raw instanceof Boolean bool) {
            return Value.newBuilder().setBoolValue(bool).build();
        }
        if (raw instanceof Number number) {
            return Value.newBuilder().setNumberValue(number.doubleValue()).build();
        }
        if (raw instanceof Collection<?> collection) {
            ListValue.Builder list = ListValue.newBuilder();
            collection.forEach(item -> list.addValues(toValue(item)));
            return Value.newBuilder().setListValue(list).build();
        }
        if (raw instanceof Map<?, ?> map) {
            Struct.Builder struct = Struct.newBuilder();
            map.forEach((key, value) -> struct.putFields(String.valueOf(key), toValue(value)));
            return Value.newBuilder().setStructValue(struct).build();
        }
        if (raw instanceof JsonNode node) {
            return Value.newBuilder().setStringValue(node.toString()).build();
        }
        return Value.newBuilder().setStringValue(String.valueOf(raw)).build();
    }

    private static Object fromValue(Value value) {
        return switch (value.getKindCase()) {
            case NULL_VALUE, KIND_NOT_SET -> null;
            case BOOL_VALUE -> value.getBoolValue();
            case NUMBER_VALUE -> {
                double number = value.getNumberValue();
                if (number == Math.rint(number) && Math.abs(number) <= 9_007_199_254_740_991d) {
                    yield (long) number;
                }
                yield number;
            }
            case STRING_VALUE -> value.getStringValue();
            case LIST_VALUE -> value.getListValue().getValuesList().stream()
                    .map(PluginDataClient::fromValue).toList();
            case STRUCT_VALUE -> {
                try {
                    yield JsonFormat.printer().omittingInsignificantWhitespace()
                            .print(value.getStructValue());
                } catch (InvalidProtocolBufferException e) {
                    yield value.getStructValue().toString();
                }
            }
        };
    }

    @PreDestroy
    void close() {
        ManagedChannel current = channel;
        if (current != null) {
            current.shutdownNow();
        }
    }
}
