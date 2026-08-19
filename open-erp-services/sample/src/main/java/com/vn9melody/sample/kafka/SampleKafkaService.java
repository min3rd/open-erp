package com.vn9melody.sample.kafka;

import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.eclipse.microprofile.reactive.messaging.Message;
import org.jboss.logging.Logger;

import com.vn9melody.kafka.KafkaSecurityContextHelper;
import com.vn9melody.security.UserContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.concurrent.CompletionStage;

@ApplicationScoped
public class SampleKafkaService {

    private static final Logger LOG = Logger.getLogger(SampleKafkaService.class);

    @Inject
    KafkaSecurityContextHelper kafkaSecurityContextHelper;

    @Inject
    UserContext userContext;

    @Inject
    @Channel("sample-events-out")
    Emitter<SampleKafkaEvent> emitter;

    /**
     * Producer: Gửi event sang Kafka có bảo toàn Security Context (Tenant, User,
     * Department, DataScope, Token).
     */
    public void publishSampleCreated(Long sampleId, String value) {
        SampleKafkaEvent event = new SampleKafkaEvent("SAMPLE_CREATED", sampleId, value);
        Message<SampleKafkaEvent> message = kafkaSecurityContextHelper.createSecureMessage(sampleId.toString(), event);
        emitter.send(message);
        LOG.infof("[KAFKA-PRODUCE] Đã gửi sự kiện Sample: %s cho tenant: %s bởi user: %s",
                sampleId, userContext.tenantId, userContext.username);
    }

    /**
     * Consumer: Nhận message từ Kafka, khôi phục Security Context và thực thi
     * logic.
     */
    @Incoming("sample-events-in")
    @Transactional
    public CompletionStage<Void> consumeSampleEvent(Message<SampleKafkaEvent> message) {
        try {
            // 1. Khôi phục context và kích hoạt Hibernate filter
            kafkaSecurityContextHelper.applySecurityContext(message);

            SampleKafkaEvent payload = message.getPayload();
            LOG.infof("[KAFKA-CONSUME] Nhận event: %s, sampleId: %s trong context [Tenant: %s, User: %s, Scope: %s]",
                    payload.eventType(), payload.sampleId(), userContext.tenantId, userContext.username,
                    userContext.currentScope);

            // 2. Thực hiện business logic trong phạm vi tenant đã được filter tự động...

            return message.ack();
        } catch (Exception e) {
            LOG.errorf("Lỗi khi xử lý message Kafka: %s", e.getMessage());
            return message.nack(e);
        }
    }
}
