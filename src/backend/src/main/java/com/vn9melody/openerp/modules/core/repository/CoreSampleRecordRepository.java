package com.vn9melody.openerp.modules.core.repository;

import com.vn9melody.openerp.modules.core.model.CoreSampleRecord;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class CoreSampleRecordRepository implements PanacheRepository<CoreSampleRecord> {

    /**
     * Accessible rows of a tenant. Data scope enforcement is injected by
     * {@code DataScopeEngine.applyReadFilter(...)} / {@code Session.enableFilter}
     * before this query runs (Hibernate {@code @Filter}); scope predicates are
     * never written manually here (TASK-284 DoD).
     */
    public PanacheQuery<CoreSampleRecord> findAccessible(UUID tenantId) {
        return find("tenantId = ?1 order by createdAt desc, id desc", tenantId);
    }

    public List<CoreSampleRecord> findByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by createdAt desc", tenantId);
    }

    public List<CoreSampleRecord> listByUser(UUID tenantId, UUID userId) {
        return list("tenantId = ?1 and (createdBy = ?2 or assigneeId = ?2) order by createdAt desc", tenantId, userId);
    }

    public List<CoreSampleRecord> listByBranch(UUID tenantId, UUID branchId) {
        return list("tenantId = ?1 and branchId = ?2 order by createdAt desc", tenantId, branchId);
    }

    public List<CoreSampleRecord> listByDepartment(UUID tenantId, UUID departmentId) {
        return list("tenantId = ?1 and departmentId = ?2 order by createdAt desc", tenantId, departmentId);
    }
}
