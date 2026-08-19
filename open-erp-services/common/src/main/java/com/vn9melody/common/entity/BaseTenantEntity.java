package com.vn9melody.common.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@MappedSuperclass
@SQLRestriction("is_deleted = false")
@FilterDef(name = "dataSecurityFilter", parameters = {
                @ParamDef(name = "tenantId", type = String.class),
                @ParamDef(name = "scope", type = String.class),
                @ParamDef(name = "departmentId", type = Long.class),
                @ParamDef(name = "username", type = String.class)
})
@Filter(name = "dataSecurityFilter", condition = "tenant_id = :tenantId AND (" +
                ":scope = 'ALL' OR " +
                "(:scope = 'DEPARTMENT' AND department_id = :departmentId) OR " +
                "(:scope = 'PERSONAL' AND created_by = :username))")
public class BaseTenantEntity extends BaseAuditEntity {
        @Column(name = "tenant_id", nullable = false, length = 50)
        public String tenantId;

        @Column(name = "department_id")
        public Long departmentId;
}
