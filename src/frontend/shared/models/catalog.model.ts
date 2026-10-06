/**
 * Sprint 05 — Catalogue plugin models (mirrors the backend enums/DTOs 1:1,
 * DES-API-S05-001 §4-5 and DES-UI-S05-001 §3). Shared by Web + Mobile.
 */

/** How the items of a catalogue type relate (backend `CatalogHierarchyMode`). */
export enum CatalogHierarchyMode {
  TREE = 'TREE',
  DAG = 'DAG',
  FLAT = 'FLAT'
}

/** Allowed edge semantics (backend `CatalogRelationType`). */
export enum CatalogRelationType {
  HIERARCHY = 'HIERARCHY',
  CLASSIFICATION = 'CLASSIFICATION',
  ALLOCATION = 'ALLOCATION',
  CUSTOM = 'CUSTOM'
}

/** Lifecycle state shared by catalogue types/items/edges (backend `CatalogStatus`). */
export enum CatalogStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/** Alias kept for the TASK-386 wording; identical values to {@link CatalogStatus}. */
export const CatalogItemStatus = CatalogStatus;
export type CatalogItemStatus = CatalogStatus;

/** Selection mode of the shared `catalog-picker`. */
export enum CatalogPickerMode {
  SINGLE = 'single',
  MULTI = 'multi'
}

/**
 * Form-field value of a catalogue field (DES-API-S05-001 §5.3): the item id when
 * picked from the catalogue and/or the display text. Free text has
 * `catalog_item_id = null`; `text` is kept as-is so a later catalogue rename
 * does not change what the form shows.
 */
export interface CatalogItemRef {
  catalog_item_id: string | null;
  text: string;
}

/** One option row of `GET /catalog/lookup/{typeCode}/options`. */
export interface CatalogOptionItem {
  id: string;
  code: string;
  name: string;
  parent_id?: string | null;
  /** Breadcrumb of ancestors when the type is hierarchical. */
  path?: string | null;
  has_children?: boolean;
  /** System catalogue item (`tenant_id IS NULL`), read-only for tenants. */
  is_system?: boolean;
  /** Tenant item overriding a system item with the same code (Q1/Q2). */
  overridden?: boolean;
  /** Type flag mirroring "free text allowed" for this option. */
  allow_free_text?: boolean;
}

/** Query of the lazy options endpoint (page defaults 0/20, size max 100). */
export interface CatalogLookupOptionsQuery {
  q?: string;
  parentId?: string | null;
  asOf?: string | null;
  page?: number;
  size?: number;
}

/** Body of `POST /catalog/lookup/{typeCode}/inline` (quick-create from free text). */
export interface CatalogInlineCreateRequest {
  name: string;
  code?: string | null;
}
