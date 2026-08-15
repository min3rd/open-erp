package com.vn9melody.entities;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "samples")
@SQLRestriction("is_deleted = false")
public class Sample extends BaseAuditEntity {
    @Column(name = "value")
    public String value;

    public Sample(String value) {
        this.value = value;
    }

}
