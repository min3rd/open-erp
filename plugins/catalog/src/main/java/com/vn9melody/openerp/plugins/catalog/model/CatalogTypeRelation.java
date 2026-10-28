package com.vn9melody.openerp.plugins.catalog.model;

import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import java.time.Instant;
import java.util.UUID;

/** Explicit parent/child relation between two catalog types (FEAT-31). */
public class CatalogTypeRelation {

    public UUID id;
    public UUID tenantId;
    public UUID parentTypeId;
    public UUID childTypeId;
    /** System relation this tenant relation was cloned from (FEAT-32). */
    public UUID systemRelationId;
    public CatalogRelationType relationType;
    public int sortOrder;
    public CatalogStatus status;
    public Instant createdAt;
    public Instant updatedAt;
}
