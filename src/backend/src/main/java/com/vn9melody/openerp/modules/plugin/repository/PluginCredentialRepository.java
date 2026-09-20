package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.core.enums.PluginCredentialScope;
import com.vn9melody.openerp.modules.plugin.model.PluginCredential;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PluginCredentialRepository implements PanacheRepositoryBase<PluginCredential, UUID> {

    public List<PluginCredential> listPlatform() {
        return list("scope = ?1 order by registryHost asc, name asc", PluginCredentialScope.PLATFORM);
    }

    public List<PluginCredential> listByTenant(UUID tenantId) {
        return list("scope = ?1 and tenantId = ?2 order by registryHost asc, name asc",
                PluginCredentialScope.TENANT, tenantId);
    }

    public Optional<PluginCredential> findPlatformByHostAndName(String registryHost, String name) {
        return find("scope = ?1 and registryHost = ?2 and name = ?3",
                PluginCredentialScope.PLATFORM, registryHost, name).firstResultOptional();
    }

    public Optional<PluginCredential> findTenantByHostAndName(UUID tenantId, String registryHost, String name) {
        return find("scope = ?1 and tenantId = ?2 and registryHost = ?3 and name = ?4",
                PluginCredentialScope.TENANT, tenantId, registryHost, name).firstResultOptional();
    }

    public boolean isInUseByPlugin(UUID credentialId) {
        return getEntityManager()
                .createQuery("select count(pv) from PluginVersion pv where function('jsonb_extract_path_text', pv.distribution, 'credential_id') = :cid", Long.class)
                .setParameter("cid", credentialId.toString())
                .getSingleResult() > 0;
    }
}
