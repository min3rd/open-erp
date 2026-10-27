-- V5.0.3: P3 - catalog read descriptors (merged options, admin list, system codes)
-- Source of truth: plugins/catalog/plugin.json. New manifest changes need a new migration.
WITH payload AS (
    SELECT
        $entities$[
  {
    "name": "CatalogType",
    "storage": "postgres",
    "table": "catalog_types",
    "public_fields": [
      "id",
      "tenant_id",
      "code",
      "name_key",
      "description_key",
      "hierarchy_mode",
      "allowed_relations",
      "allowed_parent_types",
      "max_depth",
      "min_parents",
      "allow_free_text",
      "versioned",
      "effective_dated",
      "status",
      "created_at",
      "updated_at",
      "attributes_schema"
    ],
    "storage_scope": "TENANT",
    "relations": [
      {
        "name": "tenant",
        "target_plugin": "core",
        "target_entity": "Tenant",
        "type": "many_to_one",
        "local_field": "tenant_id",
        "target_field": "id"
      }
    ]
  },
  {
    "name": "CatalogItem",
    "storage": "postgres",
    "table": "catalog_items",
    "public_fields": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "storage_scope": "TENANT",
    "relations": [
      {
        "name": "tenant",
        "target_plugin": "core",
        "target_entity": "Tenant",
        "type": "many_to_one",
        "local_field": "tenant_id",
        "target_field": "id"
      },
      {
        "name": "type",
        "target_entity": "CatalogType",
        "type": "many_to_one",
        "local_field": "type_id",
        "target_field": "id"
      },
      {
        "name": "supersedes",
        "target_entity": "CatalogItem",
        "type": "many_to_one",
        "local_field": "supersedes_item_id",
        "target_field": "id"
      }
    ]
  },
  {
    "name": "CatalogItemEdge",
    "storage": "postgres",
    "table": "catalog_item_edges",
    "public_fields": [
      "id",
      "tenant_id",
      "parent_item_id",
      "child_item_id",
      "relation_type",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "created_at",
      "created_by"
    ],
    "storage_scope": "TENANT",
    "relations": [
      {
        "name": "tenant",
        "target_plugin": "core",
        "target_entity": "Tenant",
        "type": "many_to_one",
        "local_field": "tenant_id",
        "target_field": "id"
      },
      {
        "name": "parent",
        "target_entity": "CatalogItem",
        "type": "many_to_one",
        "local_field": "parent_item_id",
        "target_field": "id"
      },
      {
        "name": "child",
        "target_entity": "CatalogItem",
        "type": "many_to_one",
        "local_field": "child_item_id",
        "target_field": "id"
      }
    ]
  },
  {
    "name": "CatalogTypeGrant",
    "storage": "postgres",
    "table": "catalog_type_grants",
    "public_fields": [
      "id",
      "tenant_id",
      "type_id",
      "role_code",
      "can_read",
      "can_write",
      "created_at",
      "updated_at"
    ],
    "storage_scope": "TENANT",
    "relations": [
      {
        "name": "tenant",
        "target_plugin": "core",
        "target_entity": "Tenant",
        "type": "many_to_one",
        "local_field": "tenant_id",
        "target_field": "id"
      },
      {
        "name": "type",
        "target_entity": "CatalogType",
        "type": "many_to_one",
        "local_field": "type_id",
        "target_field": "id"
      }
    ]
  }
]$entities$::jsonb AS entities,
        $queries$[
  {
    "id": "catalog.types.visible",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogType",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "code",
      "name_key",
      "description_key",
      "hierarchy_mode",
      "allowed_relations",
      "allowed_parent_types",
      "max_depth",
      "min_parents",
      "allow_free_text",
      "versioned",
      "effective_dated",
      "status",
      "created_at",
      "updated_at",
      "attributes_schema"
    ],
    "sort": [
      {
        "field": "code",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 500,
      "defaultSize": 500
    },
    "maxRows": 500
  },
  {
    "id": "catalog.types.system",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogType",
    "tenant_scope": "SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "code",
      "name_key",
      "description_key",
      "hierarchy_mode",
      "allowed_relations",
      "allowed_parent_types",
      "max_depth",
      "min_parents",
      "allow_free_text",
      "versioned",
      "effective_dated",
      "status",
      "created_at",
      "updated_at",
      "attributes_schema"
    ],
    "sort": [
      {
        "field": "code",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 500,
      "defaultSize": 500
    },
    "maxRows": 500
  },
  {
    "id": "catalog.types.by.code",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogType",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "code",
      "name_key",
      "description_key",
      "hierarchy_mode",
      "allowed_relations",
      "allowed_parent_types",
      "max_depth",
      "min_parents",
      "allow_free_text",
      "versioned",
      "effective_dated",
      "status",
      "created_at",
      "updated_at",
      "attributes_schema"
    ],
    "filters": [
      {
        "field": "code",
        "op": "EQ",
        "param": "code",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "tenant_id",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 10,
      "defaultSize": 10
    },
    "maxRows": 10
  },
  {
    "id": "catalog.types.by.id",
    "mode": "READ",
    "operation": "GET",
    "entity": "CatalogType",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "code",
      "name_key",
      "description_key",
      "hierarchy_mode",
      "allowed_relations",
      "allowed_parent_types",
      "max_depth",
      "min_parents",
      "allow_free_text",
      "versioned",
      "effective_dated",
      "status",
      "created_at",
      "updated_at",
      "attributes_schema"
    ],
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ]
  },
  {
    "id": "catalog.items.by.type",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "search": [
      {
        "param": "q",
        "fields": [
          "code",
          "name"
        ]
      }
    ],
    "sort": [
      {
        "field": "sort_order",
        "direction": "ASC"
      },
      {
        "field": "code",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 200,
      "defaultSize": 50
    },
    "maxRows": 200
  },
  {
    "id": "catalog.items.system.by.type",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "sort_order",
        "direction": "ASC"
      },
      {
        "field": "code",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 500,
      "defaultSize": 500
    },
    "maxRows": 500
  },
  {
    "id": "catalog.items.by.id",
    "mode": "READ",
    "operation": "GET",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ]
  },
  {
    "id": "catalog.items.by.ids",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "id",
        "op": "IN",
        "param": "ids",
        "required": true
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 500,
      "defaultSize": 500
    },
    "maxRows": 500
  },
  {
    "id": "catalog.items.by.code",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "code",
        "op": "EQ",
        "param": "code",
        "required": true
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "tenant_id",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 10,
      "defaultSize": 10
    },
    "maxRows": 10
  },
  {
    "id": "catalog.items.system.code",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "code",
        "op": "EQ",
        "param": "code",
        "required": true
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 10,
      "defaultSize": 10
    },
    "maxRows": 10
  },
  {
    "id": "catalog.items.by.version.group",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "version_group_id",
        "op": "EQ",
        "param": "version_group_id",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "version",
        "direction": "DESC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 50,
      "defaultSize": 50
    },
    "maxRows": 50
  },
  {
    "id": "catalog.edges.by.child",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "parent_item_id",
      "child_item_id",
      "relation_type",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "created_at",
      "created_by"
    ],
    "filters": [
      {
        "field": "child_item_id",
        "op": "EQ",
        "param": "child_item_id",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "sort_order",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 100,
      "defaultSize": 50
    },
    "maxRows": 100
  },
  {
    "id": "catalog.edges.by.children",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "parent_item_id",
      "child_item_id",
      "relation_type",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "created_at",
      "created_by"
    ],
    "filters": [
      {
        "field": "child_item_id",
        "op": "IN",
        "param": "child_item_ids",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "sort_order",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 500,
      "defaultSize": 500
    },
    "maxRows": 500
  },
  {
    "id": "catalog.edges.by.parent",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "parent_item_id",
      "child_item_id",
      "relation_type",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "created_at",
      "created_by"
    ],
    "filters": [
      {
        "field": "parent_item_id",
        "op": "EQ",
        "param": "parent_item_id",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "sort_order",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 500,
      "defaultSize": 500
    },
    "maxRows": 500
  },
  {
    "id": "catalog.edges.by.parents",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "parent_item_id",
      "child_item_id",
      "relation_type",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "created_at",
      "created_by"
    ],
    "filters": [
      {
        "field": "parent_item_id",
        "op": "IN",
        "param": "parent_item_ids",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "sort_order",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 500,
      "defaultSize": 500
    },
    "maxRows": 500
  },
  {
    "id": "catalog.edges.parents.with.children",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "parent_item_id"
    ],
    "filters": [
      {
        "field": "parent_item_id",
        "op": "IN",
        "param": "parent_item_ids",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status",
        "required": true
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "distinct": true,
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 1000,
      "defaultSize": 1000
    },
    "maxRows": 1000
  },
  {
    "id": "catalog.grants.by.type",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogTypeGrant",
    "tenant_scope": "TENANT",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "role_code",
      "can_read",
      "can_write",
      "created_at",
      "updated_at"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "role_code",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 100,
      "defaultSize": 100
    },
    "maxRows": 100
  },
  {
    "id": "catalog.grants.by.id",
    "mode": "READ",
    "operation": "GET",
    "entity": "CatalogTypeGrant",
    "tenant_scope": "TENANT",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "role_code",
      "can_read",
      "can_write",
      "created_at",
      "updated_at"
    ],
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ]
  },
  {
    "id": "catalog.grants.by.role",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogTypeGrant",
    "tenant_scope": "TENANT",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "role_code",
      "can_read",
      "can_write",
      "created_at",
      "updated_at"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "role_code",
        "op": "EQ",
        "param": "role_code",
        "required": true
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 10,
      "defaultSize": 10
    },
    "maxRows": 10
  },
  {
    "id": "catalog.items.admin",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "search": [
      {
        "param": "q",
        "fields": [
          "code",
          "name"
        ]
      }
    ],
    "exists": [
      {
        "entity": "CatalogItemEdge",
        "local_field": "id",
        "remote_field": "child_item_id",
        "filter_field": "parent_item_id",
        "param": "parent_id",
        "effective_param": "as_of",
        "status": "ACTIVE",
        "tenant_scope": "TENANT_OR_SYSTEM"
      },
      {
        "entity": "CatalogItemEdge",
        "local_field": "id",
        "remote_field": "child_item_id",
        "filter_field": "relation_type",
        "param": "relation_type",
        "effective_param": "as_of",
        "status": "ACTIVE",
        "tenant_scope": "TENANT_OR_SYSTEM"
      }
    ],
    "sort": [
      {
        "field": "code",
        "direction": "ASC"
      },
      {
        "field": "version",
        "direction": "DESC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 200,
      "defaultSize": 50
    },
    "maxRows": 200
  },
  {
    "id": "catalog.items.merged.options",
    "mode": "READ",
    "operation": "MERGED_LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "merge_key": "code",
    "select": [
      "id",
      "tenant_id",
      "type_id",
      "version_group_id",
      "version",
      "code",
      "name",
      "name_en",
      "description",
      "sort_order",
      "status",
      "valid_from",
      "valid_to",
      "supersedes_item_id",
      "created_at",
      "updated_at",
      "attributes",
      "created_by",
      "updated_by"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      }
    ],
    "search": [
      {
        "param": "q",
        "fields": [
          "code",
          "name"
        ]
      }
    ],
    "exists": [
      {
        "entity": "CatalogItemEdge",
        "local_field": "id",
        "remote_field": "child_item_id",
        "filter_field": "parent_item_id",
        "param": "parent_id",
        "effective_param": "as_of",
        "status": "ACTIVE",
        "tenant_scope": "TENANT_OR_SYSTEM"
      }
    ],
    "post_filters": [
      {
        "field": "status",
        "op": "EQ",
        "value": "ACTIVE"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 100,
      "defaultSize": 20
    },
    "maxRows": 100
  },
  {
    "id": "catalog.items.system.codes",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "code"
    ],
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "code",
        "op": "IN",
        "param": "codes",
        "required": true
      },
      {
        "field": "tenant_id",
        "op": "IS_NULL"
      },
      {
        "field": "valid_from",
        "op": "EFFECTIVE_AT",
        "param": "as_of",
        "required": true
      },
      {
        "field": "status",
        "op": "EQ",
        "param": "status",
        "required": true
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 1000,
      "defaultSize": 1000
    },
    "maxRows": 1000
  }
]$queries$::jsonb AS queries
)
UPDATE plugin_versions pv
SET entities = payload.entities,
    manifest = jsonb_set(
        jsonb_set(pv.manifest, '{entities}', payload.entities, true),
        '{queries}', payload.queries, true
    )
FROM plugin_catalog pc
CROSS JOIN payload
WHERE pv.catalog_id = pc.id
  AND pc.plugin_key = 'catalog'
  AND pv.version = '1.0.0';
