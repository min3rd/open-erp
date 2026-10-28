package com.vn9melody.openerp.plugins.catalog.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Versioned, effective-dated catalog record (DES-DB-S05-001 section 2.2).
 * Editing creates a new row with the same version_group_id and version + 1,
 * closing the previous row with valid_to; deletion only closes valid_to (D5/D7).
 */
public class CatalogItem {

    public UUID id;

    public UUID tenantId;

    public UUID typeId;

    /** System item this tenant row was cloned from/overrides (FEAT-32). */
    public UUID systemItemId;

    public UUID versionGroupId;

    public int version = 1;

    public String code;

    public String name;

    public String nameEn;

    public String description;

    public JsonNode attributes;

    public int sortOrder = 0;

    public CatalogStatus status = CatalogStatus.ACTIVE;

    public Instant validFrom = Instant.now();

    /** NULL = still effective. */
    public Instant validTo;

    public UUID supersedesItemId;

    public UUID createdBy;

    public Instant createdAt = Instant.now();

    public UUID updatedBy;

    public Instant updatedAt = Instant.now();
}
