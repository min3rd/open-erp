package com.vn9melody.openerp.modules.plugin.data;

import io.grpc.Context;
import io.grpc.Contexts;
import io.grpc.Grpc;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.quarkus.grpc.GlobalInterceptor;
import jakarta.enterprise.context.ApplicationScoped;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.Locale;
import javax.naming.ldap.LdapName;
import javax.naming.ldap.Rdn;
import javax.net.ssl.SSLSession;
import org.jboss.logging.Logger;

/**
 * P5: mTLS client identity. Tenant containers present a {@code CN=tenant}
 * certificate and the system container a {@code CN=system} certificate; the
 * service token still carries the authoritative tenant/scope. Both must agree,
 * so a stolen tenant token cannot be used from the system container (or vice
 * versa) even though they share the gRPC server.
 */
@GlobalInterceptor
@ApplicationScoped
public class PluginMtlsInterceptor implements ServerInterceptor {

    private static final Logger LOG = Logger.getLogger(PluginMtlsInterceptor.class);
    private static final Context.Key<String> CLIENT_ROLE = Context.key("openerp.plugin.client-role");

    static String clientRole() {
        return CLIENT_ROLE.get();
    }

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(ServerCall<ReqT, RespT> call,
                                                                 Metadata headers,
                                                                 ServerCallHandler<ReqT, RespT> next) {
        Context context = Context.current().withValue(CLIENT_ROLE, role(call));
        return Contexts.interceptCall(context, call, headers, next);
    }

    private static String role(ServerCall<?, ?> call) {
        try {
            SSLSession session = call.getAttributes().get(Grpc.TRANSPORT_ATTR_SSL_SESSION);
            if (session == null) {
                return null;
            }
            Certificate[] chain = session.getPeerCertificates();
            if (chain.length == 0 || !(chain[0] instanceof X509Certificate certificate)) {
                return null;
            }
            LdapName name = new LdapName(certificate.getSubjectX500Principal().getName());
            for (Rdn rdn : name.getRdns()) {
                if ("CN".equalsIgnoreCase(rdn.getType())) {
                    return rdn.getValue().toString().toLowerCase(Locale.ROOT);
                }
            }
        } catch (Exception e) {
            LOG.debugf("Cannot read plugin client certificate: %s", e.getMessage());
        }
        return null;
    }
}
