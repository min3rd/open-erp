package com.vn9melody.entities;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;

import com.vn9melody.configurations.AuditEntityListener;

@MappedSuperclass
@EntityListeners(AuditEntityListener.class)
public class BaseAuditEntity extends PanacheEntity {
    // --- Versioning (Optimistic Locking) ---
    @Version
    @Column(name = "version")
    public Long version;

    // --- Creation Audit ---
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt;

    @Column(name = "created_by", nullable = false, updatable = false, length = 100)
    public String createdBy;

    // --- Modification Audit ---
    @UpdateTimestamp
    @Column(name = "modified_at")
    public Instant modifiedAt;

    @Column(name = "modified_by", length = 100)
    public String modifiedBy;

    // --- Soft Delete & Retention ---
    @Column(name = "is_deleted", nullable = false)
    public boolean isDeleted = false;

    @Column(name = "deleted_at")
    public Instant deletedAt;

    @Column(name = "deleted_by", length = 100)
    public String deletedBy;

    @Column(name = "delete_expiry_time")
    public Instant deleteExpiryTime;

    // --- Soft Delete Helpers ---
    public void softDelete(String deletedBy, long retentionDays) {
        this.isDeleted = true;
        this.deletedAt = Instant.now();
        this.deletedBy = deletedBy;
        this.deleteExpiryTime = this.deletedAt.plus(java.time.Duration.ofDays(retentionDays));
    }

    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        this.deleteExpiryTime = null;
    }
}
