package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.CompanySize;
import com.vn9melody.openerp.core.enums.TenantType;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenants")
@RegisterEntity(
    entityName = "Tenant",
    table = "tenants",
    publicFields = {"id", "slug", "name", "type", "status"}
)
public class Tenant extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "slug", nullable = false, unique = true, length = 64)
    public String slug;

    @Column(name = "name", nullable = false)
    public String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    public TenantType type = TenantType.BUSINESS;

    @Column(name = "tax_code", length = 32)
    public String taxCode;

    @Column(name = "company_size", length = 32)
    public CompanySize companySize;

    @Column(name = "currency", length = 8)
    public String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32)
    public AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    public static Tenant findBySlug(String slug) {
        return find("slug", slug).firstResult();
    }
}
