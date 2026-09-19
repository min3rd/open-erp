package com.vn9melody.openerp.modules.core.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

/**
 * Reference entity used to verify the Data Permission Enforcement Engine (FEAT-17).
 * Carries the standard scope columns: tenant_id, branch_id, department_id,
 * created_by and assignee_id.
 */
@Entity
@Table(name = "core_sample_records")
@FilterDef(name = "coreSampleRecord_none")
@FilterDef(name = "coreSampleRecord_all", parameters = @ParamDef(name = "tenantId", type = UUID.class))
@FilterDef(name = "coreSampleRecord_branch", parameters = {
    @ParamDef(name = "tenantId", type = UUID.class),
    @ParamDef(name = "branchIds", type = UUID.class)
})
@FilterDef(name = "coreSampleRecord_department", parameters = {
    @ParamDef(name = "tenantId", type = UUID.class),
    @ParamDef(name = "departmentIds", type = UUID.class)
})
@FilterDef(name = "coreSampleRecord_own", parameters = {
    @ParamDef(name = "tenantId", type = UUID.class),
    @ParamDef(name = "ownerId", type = UUID.class)
})
@FilterDef(name = "coreSampleRecord_owner_ids", parameters = {
    @ParamDef(name = "tenantId", type = UUID.class),
    @ParamDef(name = "ownerIds", type = UUID.class)
})
@Filter(name = "coreSampleRecord_none", condition = "1 = 0")
@Filter(name = "coreSampleRecord_all", condition = "tenant_id = :tenantId")
@Filter(name = "coreSampleRecord_branch", condition = "tenant_id = :tenantId and branch_id in (:branchIds)")
@Filter(name = "coreSampleRecord_department",
    condition = "tenant_id = :tenantId and department_id in (:departmentIds)")
@Filter(name = "coreSampleRecord_own",
    condition = "tenant_id = :tenantId and (created_by = :ownerId or assignee_id = :ownerId)")
@Filter(name = "coreSampleRecord_owner_ids",
    condition = "tenant_id = :tenantId and (created_by in (:ownerIds) or assignee_id in (:ownerIds))")
@RegisterEntity(
    entityName = "CoreSampleRecord",
    pluginId = "core",
    table = "core_sample_records",
    publicFields = {"id", "tenant_id", "branch_id", "department_id", "created_by", "assignee_id", "title", "amount", "status", "created_at"},
    relations = {"tenants", "branches", "departments", "users"}
)
public class CoreSampleRecord extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "branch_id")
    public UUID branchId;

    @Column(name = "department_id")
    public UUID departmentId;

    @Column(name = "created_by", nullable = false)
    public UUID createdBy;

    @Column(name = "assignee_id")
    public UUID assigneeId;

    @Column(name = "title", nullable = false)
    public String title;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    public BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 32)
    public String status = "ACTIVE";

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();
}
