package com.vn9melody.openerp.modules.plugin.data;

import com.google.protobuf.ListValue;
import com.google.protobuf.NullValue;
import com.google.protobuf.Struct;
import com.google.protobuf.Value;
import com.vn9melody.openerp.plugin.data.v1.ExecuteBatchRequest;
import com.vn9melody.openerp.plugin.data.v1.ExecuteBatchResponse;
import com.vn9melody.openerp.plugin.data.v1.ExecuteRequest;
import com.vn9melody.openerp.plugin.data.v1.ExecuteResponse;
import com.vn9melody.openerp.plugin.data.v1.PingRequest;
import com.vn9melody.openerp.plugin.data.v1.PingResponse;
import com.vn9melody.openerp.plugin.data.v1.PluginDataServiceGrpc;
import com.vn9melody.openerp.plugin.data.v1.Row;
import io.grpc.Metadata;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Internal gRPC entry point for plugin data access. Plugins send a descriptor
 * id plus parameters; core validates identity and executes the compiled SQL.
 */
@GrpcService
@Blocking
public class PluginDataGrpcService extends PluginDataServiceGrpc.PluginDataServiceImplBase {

    private static final Metadata.Key<String> ERROR_CODE =
            Metadata.Key.of("x-error-code", Metadata.ASCII_STRING_MARSHALLER);

    @Inject
    PluginServiceIdentityResolver identityResolver;

    @Inject
    PluginDataExecutor executor;

    @Override
    public void ping(PingRequest request, StreamObserver<PingResponse> responseObserver) {
        responseObserver.onNext(PingResponse.newBuilder()
                .setService("openerp-plugin-data")
                .setVersion("1.0.0")
                .build());
        responseObserver.onCompleted();
    }

    @Override
    public void execute(ExecuteRequest request, StreamObserver<ExecuteResponse> responseObserver) {
        try {
            PluginServiceIdentity identity = identity();
            PluginDataExecutor.Result result = executor.execute(identity, request.getQueryId(),
                    request.getRequestId(), request.getParamsMap());
            responseObserver.onNext(response(request.getRequestId(), result));
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            fail(e, responseObserver);
        }
    }

    @Override
    public void executeBatch(ExecuteBatchRequest request,
                             StreamObserver<ExecuteBatchResponse> responseObserver) {
        try {
            PluginServiceIdentity identity = identity();
            List<PluginDataExecutor.BatchStatement> statements = request.getStatementsList().stream()
                    .map(statement -> new PluginDataExecutor.BatchStatement(statement.getQueryId(),
                            statement.getRequestId(), statement.getParamsMap()))
                    .toList();
            List<PluginDataExecutor.Result> results = executor.executeBatch(identity, statements);
            ExecuteBatchResponse.Builder response = ExecuteBatchResponse.newBuilder()
                    .setSuccess(true)
                    .setCode("PLUGIN_DATA_SUCCESS")
                    .setRequestId(requestId(request.getStatementsList()));
            for (int index = 0; index < results.size(); index++) {
                String statementRequestId = request.getStatements(index).getRequestId();
                response.addStatements(response(statementRequestId, results.get(index)));
            }
            responseObserver.onNext(response.build());
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            fail(e, responseObserver);
        }
    }

    private PluginServiceIdentity identity() {
        Metadata metadata = PluginDataMetadataInterceptor.METADATA.get();
        return identityResolver.resolve(metadata != null ? metadata : new Metadata());
    }

    private ExecuteResponse response(String requestId, PluginDataExecutor.Result result) {
        ExecuteResponse.Builder response = ExecuteResponse.newBuilder()
                .setSuccess(true)
                .setCode("PLUGIN_DATA_SUCCESS")
                .setRequestId(requestId == null ? "" : requestId)
                .setAffectedRows(result.affectedRows())
                .setTotalRows(result.totalRows());
        for (Map<String, Object> row : result.rows()) {
            Row.Builder builder = Row.newBuilder();
            row.forEach((key, value) -> builder.putValues(key, value(value)));
            response.addRows(builder.build());
        }
        return response.build();
    }

    private String requestId(List<ExecuteRequest> statements) {
        return statements.isEmpty() ? "" : statements.get(0).getRequestId();
    }

    private Value value(Object raw) {
        if (raw == null) {
            return Value.newBuilder().setNullValue(NullValue.NULL_VALUE).build();
        }
        if (raw instanceof Boolean bool) {
            return Value.newBuilder().setBoolValue(bool).build();
        }
        if (raw instanceof Short || raw instanceof Integer || raw instanceof Long) {
            long value = ((Number) raw).longValue();
            if (Math.abs(value) <= 9_007_199_254_740_991L) {
                return Value.newBuilder().setNumberValue(value).build();
            }
            return Value.newBuilder().setStringValue(String.valueOf(value)).build();
        }
        if (raw instanceof Double || raw instanceof Float) {
            return Value.newBuilder().setNumberValue(((Number) raw).doubleValue()).build();
        }
        if (raw instanceof BigDecimal decimal) {
            return Value.newBuilder().setStringValue(decimal.toPlainString()).build();
        }
        if (raw instanceof List<?> list) {
            ListValue.Builder values = ListValue.newBuilder();
            list.forEach(item -> values.addValues(value(item)));
            return Value.newBuilder().setListValue(values).build();
        }
        if (raw instanceof Map<?, ?> map) {
            Struct.Builder struct = Struct.newBuilder();
            map.forEach((key, item) -> struct.putFields(String.valueOf(key), value(item)));
            return Value.newBuilder().setStructValue(struct).build();
        }
        return Value.newBuilder().setStringValue(String.valueOf(raw)).build();
    }

    private void fail(RuntimeException error, StreamObserver<?> observer) {
        PluginDataException exception = error instanceof PluginDataException plugin
                ? plugin
                : new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                        "PLUGIN_DATA_EXECUTION_FAILED", error);
        String code = exception.getMessage() != null ? exception.getMessage() : "PLUGIN_DATA_FAILED";
        int separator = code.indexOf(':');
        if (separator > 0) {
            code = code.substring(0, separator);
        }
        Metadata trailers = new Metadata();
        trailers.put(ERROR_CODE, code);
        observer.onError(Status.fromCode(exception.status())
                .withDescription(code)
                .asRuntimeException(trailers));
    }
}
