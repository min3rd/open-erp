package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.UserDirectoryItem;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Tenant user directory used by the role-assignment drawer (TASK-278).
 */
@ApplicationScoped
public class IamUserDirectoryService {

    @Inject
    EntityManager entityManager;

    public UserDirectoryPage listUsers(UUID tenantId, String keyword, String status, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 200);
        StringBuilder where = new StringBuilder(" where ut.tenant_id = ?1 ");
        List<Object> params = new ArrayList<>();
        params.add(tenantId);

        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (lower(u.email) like ?2 or lower(coalesce(p.full_name, '')) like ?2) ");
            params.add("%" + keyword.trim().toLowerCase() + "%");
        }
        if (status != null && !status.isBlank()) {
            where.append(" and u.status = ?").append(params.size() + 1).append(" ");
            params.add(status.trim().toUpperCase());
        }

        String baseFrom = " from user_tenants ut join users u on u.id = ut.user_id "
            + " left join user_profiles p on p.user_id = u.id " + where;

        var countQuery = entityManager.createNativeQuery("select count(*) " + baseFrom);
        for (int i = 0; i < params.size(); i++) {
            countQuery.setParameter(i + 1, params.get(i));
        }
        long total = ((Number) countQuery.getSingleResult()).longValue();

        int limitIndex = params.size() + 1;
        int offsetIndex = params.size() + 2;
        var dataQuery = entityManager.createNativeQuery(
            "select u.id, u.email, p.full_name, u.status " + baseFrom
                + " order by u.email asc limit ?" + limitIndex + " offset ?" + offsetIndex);
        for (int i = 0; i < params.size(); i++) {
            dataQuery.setParameter(i + 1, params.get(i));
        }
        dataQuery.setParameter(limitIndex, safeSize);
        dataQuery.setParameter(offsetIndex, (long) safePage * safeSize);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = dataQuery.getResultList();
        List<UserDirectoryItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            items.add(new UserDirectoryItem(
                row[0] != null ? row[0].toString() : null,
                row[1] != null ? row[1].toString() : null,
                row[2] != null ? row[2].toString() : null,
                row[3] != null ? row[3].toString() : null
            ));
        }
        return new UserDirectoryPage(items, safePage, safeSize, total);
    }

    public record UserDirectoryPage(List<UserDirectoryItem> items, int page, int size, long totalItems) {
    }
}
