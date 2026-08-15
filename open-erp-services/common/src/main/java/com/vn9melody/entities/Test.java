package com.vn9melody.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import com.vn9melody.entities.BaseAuditEntity;

@Entity
@Table(name = "test")
class Test extends BaseAuditEntity {
    @Column(name = "value")
    private String value;
}