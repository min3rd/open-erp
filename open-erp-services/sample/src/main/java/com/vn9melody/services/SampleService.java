package com.vn9melody.services;

import com.vn9melody.common.entity.Sample;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SampleService implements PanacheRepository<Sample> {
    @Transactional
    public Sample create(String value) {
        Sample sample = new Sample(value);
        sample.persist();
        return sample;
    }
}
