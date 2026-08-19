package com.vn9melody.common.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tenants")
@SQLRestriction("is_deleted = false")
public class Tenant extends BaseAuditEntity {
    @Column(nullable = false, unique = true, length = 50)
    public String code;

    @Column(nullable = false, length = 200)
    public String name;

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true;
}
