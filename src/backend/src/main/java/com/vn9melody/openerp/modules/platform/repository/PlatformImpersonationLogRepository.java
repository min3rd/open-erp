package com.vn9melody.openerp.modules.platform.repository;

import com.vn9melody.openerp.modules.platform.model.PlatformImpersonationLog;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PlatformImpersonationLogRepository implements PanacheRepository<PlatformImpersonationLog> {
}
