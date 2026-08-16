package com.vn9melody.kafka;

public record SampleKafkaEvent(
        String eventType,
        Long sampleId,
        String value) {
}
