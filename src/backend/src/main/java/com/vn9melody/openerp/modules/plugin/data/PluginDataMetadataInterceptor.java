package com.vn9melody.openerp.modules.plugin.data;

import io.grpc.Context;
import io.grpc.Contexts;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.quarkus.grpc.GlobalInterceptor;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Copies the request metadata into the gRPC context so the service method can
 * resolve the certified plugin identity.
 */
@ApplicationScoped
@GlobalInterceptor
public class PluginDataMetadataInterceptor implements ServerInterceptor {

    public static final Context.Key<Metadata> METADATA = Context.key("plugin-data-metadata");

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call, Metadata headers, ServerCallHandler<ReqT, RespT> next) {
        Context context = Context.current().withValue(METADATA, headers);
        return Contexts.interceptCall(context, call, headers, next);
    }
}
