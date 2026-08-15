package com.vn9melody.entities;

import com.vn9melody.enums.ModuleCode;
import com.vn9melody.enums.PermissionCode;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "permissions")
public class Permission extends PanacheEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    public PermissionCode code;

    @Enumerated(EnumType.STRING)
    @Column(name = "module", nullable = false, length = 50)
    public ModuleCode module;

    @Column(length = 255)
    public String description;

    // Helper tự động đồng bộ description và module từ Enum khi persist
    public static Permission fromEnum(PermissionCode permCode) {
        Permission p = new Permission();
        p.code = permCode;
        p.module = permCode.getModule();
        p.description = permCode.getDescription();
        return p;
    }
}