package com.vn9melody.entities;

import com.vn9melody.enums.RoleCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Role extends BaseTenantEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, length = 50)
    public RoleCode code;

    @Column(nullable = false, length = 100)
    public String name;
}