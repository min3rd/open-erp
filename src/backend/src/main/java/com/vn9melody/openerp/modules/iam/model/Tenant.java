package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.enums.CompanySize;
import com.vn9melody.openerp.core.enums.TenantPlanTier;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.TenantType;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tenants")
@RegisterEntity(
    entityName = "Tenant",
    table = "tenants",
    publicFields = {"id", "slug", "name", "type", "status", "plan_tier", "is_locked"}
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
    public TenantStatus status = TenantStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_tier", nullable = false, length = 32)
    public TenantPlanTier planTier = TenantPlanTier.STANDARD;

    @Column(name = "max_users", nullable = false)
    public Integer maxUsers = 10;

    @Column(name = "max_storage_mb", nullable = false)
    public Integer maxStorageMb = 5120;

    @Column(name = "trial_ends_at")
    public Instant trialEndsAt;

    @Column(name = "is_locked", nullable = false)
    public Boolean isLocked = false;

    @Column(name = "lock_reason")
    public String lockReason;

    @Column(name = "locked_at")
    public Instant lockedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_plugins", columnDefinition = "jsonb")
    public List<String> allowedPlugins = new ArrayList<>(List.of("core"));

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    public static Tenant findBySlug(String slug) {
        return find("slug", slug).firstResult();
    }
}
