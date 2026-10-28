package com.vn9melody.openerp.plugins.catalog.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogHierarchyMode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Catalog type definition (DES-DB-S05-001 section 2.1). tenant_id NULL means a
 * system type owned by the platform; tenant rows may override a system code
 * (D10/D18: tenant wins when options are merged).
 */
public class CatalogType {

    public UUID id;

    public UUID tenantId;

    /** System type this tenant row was cloned from (FEAT-32); NULL for system rows. */
    public UUID systemTypeId;

    public String code;

    public String nameKey;

    public String descriptionKey;

    public CatalogHierarchyMode hierarchyMode = CatalogHierarchyMode.TREE;

    public String[] allowedRelations = {"HIERARCHY"};

    /** NULL = same-type parents only (safe default). */
    public String[] allowedParentTypes;

    public Short maxDepth;

    public short minParents = 0;

    public boolean allowFreeText = false;

    public boolean versioned = true;

    public boolean effectiveDated = true;

    public JsonNode attributesSchema;

    public CatalogStatus status = CatalogStatus.ACTIVE;

    public Instant createdAt = Instant.now();

    public Instant updatedAt = Instant.now();
}
