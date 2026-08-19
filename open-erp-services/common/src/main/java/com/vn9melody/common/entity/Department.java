package com.vn9melody.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "departments")
public class Department extends BaseTenantEntity {
    @Column(nullable = false, length = 100)
    public String name;

    @Column(name = "parent_id")
    public Long parentId; // Hỗ trợ cây tổ chức đa cấp (Nested Departments)
}
