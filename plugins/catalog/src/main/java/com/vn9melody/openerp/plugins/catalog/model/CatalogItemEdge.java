package com.vn9melody.openerp.plugins.catalog.model;

import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Explicit parent-child edge of a catalog DAG (DES-DB-S05-001 section 2.3).
 * Multi-parent and skip-level relations are single rows; removing a relation
 * closes valid_to instead of deleting the row (D2/D7).
 */
public class CatalogItemEdge {

    public UUID id;

    public UUID tenantId;

    public UUID parentItemId;

    public UUID childItemId;

    /** System edge this tenant edge was cloned from (FEAT-32). */
    public UUID systemEdgeId;

    public CatalogRelationType relationType = CatalogRelationType.HIERARCHY;

    public int sortOrder = 0;

    public CatalogStatus status = CatalogStatus.ACTIVE;

    public Instant validFrom = Instant.now();

    /** NULL = still effective. */
    public Instant validTo;

    public UUID createdBy;

    public Instant createdAt = Instant.now();
}
