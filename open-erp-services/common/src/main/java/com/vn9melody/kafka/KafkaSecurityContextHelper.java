package com.vn9melody.kafka;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.Callable;

import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.header.internals.RecordHeaders;
import org.eclipse.microprofile.reactive.messaging.Message;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.jboss.logging.Logger;

import com.vn9melody.common.enums.DataScope;
import com.vn9melody.security.UserContext;
import com.vn9melody.security.jwt.JwtClaimsConstant;

import io.smallrye.reactive.messaging.kafka.api.IncomingKafkaRecordMetadata;
import io.smallrye.reactive.messaging.kafka.api.OutgoingKafkaRecordMetadata;
import io.smallrye.reactive.messaging.kafka.api.OutgoingKafkaRecordMetadata.OutgoingKafkaRecordMetadataBuilder;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

@ApplicationScoped
public class KafkaSecurityContextHelper {

    private static final Logger LOG = Logger.getLogger(KafkaSecurityContextHelper.class);

    @Inject
    UserContext userContext;

    @Inject
    EntityManager entityManager;

    /**
     * Tạo Message đính kèm Kafka Record Headers mang Security Context hiện tại.
     */
    public <T> Message<T> createSecureMessage(T payload) {
        return createSecureMessage(null, payload);
    }

    /**
     * Tạo Message với Key và Payload đính kèm Kafka Record Headers mang Security
     * Context hiện tại.
     */
    public <K, T> Message<T> createSecureMessage(K key, T payload) {
        Headers headers = new RecordHeaders();

        if (userContext != null && userContext.isAuthenticated()) {
            if (userContext.rawToken != null) {
                headers.add(JwtClaimsConstant.HEADER_AUTHORIZATION,
                        (JwtClaimsConstant.BEARER_PREFIX + userContext.rawToken).getBytes(StandardCharsets.UTF_8));
            }
            if (userContext.tenantId != null) {
                headers.add(JwtClaimsConstant.HEADER_X_TENANT_ID,
                        userContext.tenantId.getBytes(StandardCharsets.UTF_8));
            }
            if (userContext.userId != null) {
                headers.add(JwtClaimsConstant.HEADER_X_USER_ID,
                        userContext.userId.toString().getBytes(StandardCharsets.UTF_8));
            }
            if (userContext.username != null) {
                headers.add(JwtClaimsConstant.HEADER_X_USERNAME, userContext.username.getBytes(StandardCharsets.UTF_8));
            }
            if (userContext.departmentId != null) {
                headers.add(JwtClaimsConstant.HEADER_X_DEPARTMENT_ID,
                        userContext.departmentId.toString().getBytes(StandardCharsets.UTF_8));
            }
            if (userContext.currentScope != null) {
                headers.add(JwtClaimsConstant.HEADER_X_DATA_SCOPE,
                        userContext.currentScope.name().getBytes(StandardCharsets.UTF_8));
            }
        }

        OutgoingKafkaRecordMetadataBuilder<K> builder = OutgoingKafkaRecordMetadata.<K>builder()
                .withHeaders(headers);
        if (key != null) {
            builder.withKey(key);
        }

        return Message.of(payload).addMetadata(builder.build());
    }

    /**
     * Trích xuất Security Context từ Kafka Record Headers và kích hoạt Hibernate
     * Filter.
     */
    public void applySecurityContext(Message<?> message) {
        Optional<IncomingKafkaRecordMetadata> metadataOpt = message.getMetadata(IncomingKafkaRecordMetadata.class);
        if (metadataOpt.isEmpty()) {
            LOG.warn("Kafka message không có metadata hoặc headers");
            return;
        }

        Headers headers = metadataOpt.get().getHeaders();
        if (headers == null) {
            return;
        }

        String tenantId = getHeaderValue(headers, JwtClaimsConstant.HEADER_X_TENANT_ID);
        String username = getHeaderValue(headers, JwtClaimsConstant.HEADER_X_USERNAME);
        String userIdStr = getHeaderValue(headers, JwtClaimsConstant.HEADER_X_USER_ID);
        String deptIdStr = getHeaderValue(headers, JwtClaimsConstant.HEADER_X_DEPARTMENT_ID);
        String scopeStr = getHeaderValue(headers, JwtClaimsConstant.HEADER_X_DATA_SCOPE);
        String authHeader = getHeaderValue(headers, JwtClaimsConstant.HEADER_AUTHORIZATION);

        Long userId = (userIdStr != null && !userIdStr.isBlank()) ? Long.valueOf(userIdStr) : null;
        Long departmentId = (deptIdStr != null && !deptIdStr.isBlank()) ? Long.valueOf(deptIdStr) : null;
        DataScope scope = (scopeStr != null && !scopeStr.isBlank()) ? DataScope.valueOf(scopeStr) : DataScope.ALL;

        String rawToken = null;
        if (authHeader != null && authHeader.startsWith(JwtClaimsConstant.BEARER_PREFIX)) {
            rawToken = authHeader.substring(JwtClaimsConstant.BEARER_PREFIX.length());
        }

        if (userContext != null) {
            userContext.init(tenantId, userId, username, departmentId, scope, Collections.emptySet(),
                    Collections.emptySet(), rawToken);
        }

        if (entityManager != null && tenantId != null) {
            try {
                Session session = entityManager.unwrap(Session.class);
                Filter filter = session.enableFilter("dataSecurityFilter");
                filter.setParameter("tenantId", tenantId);
                filter.setParameter("scope", scope.name());
                filter.setParameter("departmentId", departmentId != null ? departmentId : -1L);
                filter.setParameter("username", username != null ? username : "");
            } catch (Exception e) {
                LOG.warnf("Không thể kích hoạt Hibernate filter trong Kafka context: %s", e.getMessage());
            }
        }
    }

    /**
     * Thực thi một tác vụ bất đồng bộ hoặc đồng bộ trong ngữ cảnh Security của
     * Kafka Message
     */
    public <R> R executeInContext(Message<?> message, Callable<R> action) throws Exception {
        applySecurityContext(message);
        return action.call();
    }

    private String getHeaderValue(Headers headers, String headerKey) {
        Header header = headers.lastHeader(headerKey);
        if (header != null && header.value() != null) {
            return new String(header.value(), StandardCharsets.UTF_8);
        }
        return null;
    }
}
