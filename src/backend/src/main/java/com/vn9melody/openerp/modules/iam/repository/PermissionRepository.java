package com.vn9melody.openerp.modules.iam.repository;

import com.vn9melody.openerp.modules.iam.model.Permission;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class PermissionRepository implements PanacheRepository<Permission> {

    public Permission findByCode(String code) {
        return find("code", code).firstResult();
    }

    public List<Permission> listAllOrdered() {
        return list("order by domain asc, resource asc, action asc");
    }

    public List<Permission> listByDomain(String domain) {
        return list("domain = ?1 order by resource asc, action asc", domain);
    }

    public long countByAction(String action) {
        return count("action", action);
    }
}
