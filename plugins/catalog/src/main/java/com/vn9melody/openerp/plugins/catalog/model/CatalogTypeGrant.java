package com.vn9melody.openerp.plugins.catalog.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Per-role read/write grant on one catalog type (DES-DB-S05-001 section 2.4,
 * SOL-S05-001 D9). Both the module permission and a grant on the type are
 * required, except for the platform admin on system types.
 */
public class CatalogTypeGrant {

    public UUID id;

    public UUID tenantId;

    public UUID typeId;

    public String roleCode;

    public boolean canRead = true;

    public boolean canWrite = false;

    public Instant createdAt = Instant.now();

    public Instant updatedAt = Instant.now();
}
