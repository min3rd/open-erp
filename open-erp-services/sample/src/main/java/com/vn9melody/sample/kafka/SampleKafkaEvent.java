package com.vn9melody.sample.kafka;

public record SampleKafkaEvent(
                String eventType,
                Long sampleId,
                String value) {
}
