package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PluginVersionRepository implements PanacheRepository<PluginVersion> {

    public Optional<PluginVersion> findByCatalogAndVersion(UUID catalogId, String version) {
        return find("catalogId = ?1 and version = ?2", catalogId, version).firstResultOptional();
    }

    public List<PluginVersion> listByCatalog(UUID catalogId) {
        return list("catalogId = ?1 order by createdAt desc", catalogId);
    }

    public List<PluginVersion> listInstallable(UUID catalogId) {
        return list("catalogId = ?1 and releaseStatus in (?2, ?3) order by createdAt desc",
                catalogId, PluginReleaseStatus.PUBLISHED, PluginReleaseStatus.DEPRECATED);
    }

    public boolean isVersionInUse(UUID catalogId, String version) {
        return getEntityManager()
                .createQuery("select count(tp) from TenantPlugin tp where tp.catalogId = :catalogId and tp.installedVersion = :version", Long.class)
                .setParameter("catalogId", catalogId)
                .setParameter("version", version)
                .getSingleResult() > 0;
    }
}
