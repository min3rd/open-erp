package com.vn9melody.configurations;

import com.vn9melody.common.entity.BaseAuditEntity;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.inject.spi.CDI;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

public class AuditEntityListener {

    @PrePersist
    public void setCreationAudit(BaseAuditEntity entity) {
        String user = getCurrentUsername();
        entity.createdBy = user;
        entity.modifiedBy = user;
    }

    @PreUpdate
    public void setModificationAudit(BaseAuditEntity entity) {
        entity.modifiedBy = getCurrentUsername();
    }

    private String getCurrentUsername() {
        try {
            SecurityIdentity identity = CDI.current().select(SecurityIdentity.class).get();
            if (identity != null && !identity.isAnonymous() && identity.getPrincipal() != null) {
                return identity.getPrincipal().getName();
            }
        } catch (Exception e) {
            return "SYSTEM";
        }
        return "ANONYMOUS";
    }
}
