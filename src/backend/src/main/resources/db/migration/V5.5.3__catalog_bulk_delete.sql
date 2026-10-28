-- V5.5.3: bulk delete returns more than the default plugin data row limit
WITH payload AS (
    SELECT $queries$[
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
      "attributes_schema",
      "system_type_id"
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
      "attributes_schema",
      "system_type_id"
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
    "maxRows": 500,
    "filters": [
      {
        "field": "tenant_id",
        "op": "IS_NULL"
      }
    ]
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
      "attributes_schema",
      "system_type_id"
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
      "attributes_schema",
      "system_type_id"
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
        "field": "tenant_id",
        "op": "IS_NULL"
      },
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
      "maxSize": 2000,
      "defaultSize": 2000
    },
    "maxRows": 2000,
    "bulk": true
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
    "operation": "MERGED_LIST",
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
    "maxRows": 200,
    "sort_param": "sort",
    "direction_param": "direction",
    "sort_fields": [
      "code",
      "name",
      "sort_order",
      "status",
      "valid_from",
      "version",
      "created_at"
    ],
    "merge_key": "code"
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
  },
  {
    "id": "catalog.type.insert",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogType",
    "tenant_scope": "TENANT",
    "values": {
      "code": {
        "param": "code"
      },
      "name_key": {
        "param": "name_key"
      },
      "description_key": {
        "param": "description_key",
        "optional": true,
        "allow_null": true
      },
      "hierarchy_mode": {
        "param": "hierarchy_mode",
        "optional": true
      },
      "allowed_relations": {
        "param": "allowed_relations",
        "type": "varchar[]",
        "optional": true
      },
      "allowed_parent_types": {
        "param": "allowed_parent_types",
        "type": "varchar[]",
        "optional": true,
        "allow_null": true
      },
      "max_depth": {
        "param": "max_depth",
        "optional": true,
        "allow_null": true
      },
      "min_parents": {
        "param": "min_parents",
        "optional": true
      },
      "allow_free_text": {
        "param": "allow_free_text",
        "optional": true
      },
      "versioned": {
        "param": "versioned",
        "optional": true
      },
      "effective_dated": {
        "param": "effective_dated",
        "optional": true
      },
      "attributes_schema": {
        "param": "attributes_schema",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      },
      "system_type_id": {
        "param": "system_type_id",
        "optional": true,
        "allow_null": true
      }
    },
    "returning": [
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
    ]
  },
  {
    "id": "catalog.type.insert.system",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogType",
    "tenant_scope": "SYSTEM",
    "values": {
      "code": {
        "param": "code"
      },
      "name_key": {
        "param": "name_key"
      },
      "description_key": {
        "param": "description_key",
        "optional": true,
        "allow_null": true
      },
      "hierarchy_mode": {
        "param": "hierarchy_mode",
        "optional": true
      },
      "allowed_relations": {
        "param": "allowed_relations",
        "type": "varchar[]",
        "optional": true
      },
      "allowed_parent_types": {
        "param": "allowed_parent_types",
        "type": "varchar[]",
        "optional": true,
        "allow_null": true
      },
      "max_depth": {
        "param": "max_depth",
        "optional": true,
        "allow_null": true
      },
      "min_parents": {
        "param": "min_parents",
        "optional": true
      },
      "allow_free_text": {
        "param": "allow_free_text",
        "optional": true
      },
      "versioned": {
        "param": "versioned",
        "optional": true
      },
      "effective_dated": {
        "param": "effective_dated",
        "optional": true
      },
      "attributes_schema": {
        "param": "attributes_schema",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      }
    },
    "returning": [
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
    ]
  },
  {
    "id": "catalog.type.update",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogType",
    "tenant_scope": "TENANT",
    "values": {
      "code": {
        "param": "code"
      },
      "name_key": {
        "param": "name_key"
      },
      "description_key": {
        "param": "description_key",
        "optional": true,
        "allow_null": true
      },
      "hierarchy_mode": {
        "param": "hierarchy_mode",
        "optional": true
      },
      "allowed_relations": {
        "param": "allowed_relations",
        "type": "varchar[]",
        "optional": true
      },
      "allowed_parent_types": {
        "param": "allowed_parent_types",
        "type": "varchar[]",
        "optional": true,
        "allow_null": true
      },
      "max_depth": {
        "param": "max_depth",
        "optional": true,
        "allow_null": true
      },
      "min_parents": {
        "param": "min_parents",
        "optional": true
      },
      "allow_free_text": {
        "param": "allow_free_text",
        "optional": true
      },
      "versioned": {
        "param": "versioned",
        "optional": true
      },
      "effective_dated": {
        "param": "effective_dated",
        "optional": true
      },
      "attributes_schema": {
        "param": "attributes_schema",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      },
      "system_type_id": {
        "param": "system_type_id",
        "optional": true,
        "allow_null": true
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.type.update.system",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogType",
    "tenant_scope": "SYSTEM",
    "values": {
      "code": {
        "param": "code"
      },
      "name_key": {
        "param": "name_key"
      },
      "description_key": {
        "param": "description_key",
        "optional": true,
        "allow_null": true
      },
      "hierarchy_mode": {
        "param": "hierarchy_mode",
        "optional": true
      },
      "allowed_relations": {
        "param": "allowed_relations",
        "type": "varchar[]",
        "optional": true
      },
      "allowed_parent_types": {
        "param": "allowed_parent_types",
        "type": "varchar[]",
        "optional": true,
        "allow_null": true
      },
      "max_depth": {
        "param": "max_depth",
        "optional": true,
        "allow_null": true
      },
      "min_parents": {
        "param": "min_parents",
        "optional": true
      },
      "allow_free_text": {
        "param": "allow_free_text",
        "optional": true
      },
      "versioned": {
        "param": "versioned",
        "optional": true
      },
      "effective_dated": {
        "param": "effective_dated",
        "optional": true
      },
      "attributes_schema": {
        "param": "attributes_schema",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.grant.delete.by.type",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogTypeGrant",
    "tenant_scope": "TENANT",
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.grant.insert",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogTypeGrant",
    "tenant_scope": "TENANT",
    "values": {
      "type_id": {
        "param": "type_id"
      },
      "role_code": {
        "param": "role_code"
      },
      "can_read": {
        "param": "can_read"
      },
      "can_write": {
        "param": "can_write"
      },
      "created_at": {
        "param": "created_at"
      },
      "updated_at": {
        "param": "updated_at"
      }
    },
    "returning": [
      "id",
      "tenant_id",
      "type_id",
      "role_code",
      "can_read",
      "can_write",
      "created_at",
      "updated_at"
    ]
  },
  {
    "id": "catalog.item.insert",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
    "values": {
      "type_id": {
        "param": "type_id"
      },
      "version_group_id": {
        "param": "version_group_id"
      },
      "version": {
        "param": "version"
      },
      "code": {
        "param": "code"
      },
      "name": {
        "param": "name"
      },
      "name_en": {
        "param": "name_en",
        "optional": true,
        "allow_null": true
      },
      "description": {
        "param": "description",
        "optional": true,
        "allow_null": true
      },
      "attributes": {
        "param": "attributes",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      },
      "valid_from": {
        "param": "valid_from"
      },
      "valid_to": {
        "param": "valid_to",
        "optional": true,
        "allow_null": true
      },
      "supersedes_item_id": {
        "param": "supersedes_item_id",
        "optional": true,
        "allow_null": true
      },
      "created_by": {
        "param": "created_by",
        "optional": true,
        "allow_null": true
      },
      "created_at": {
        "param": "created_at"
      },
      "updated_by": {
        "param": "updated_by",
        "optional": true,
        "allow_null": true
      },
      "updated_at": {
        "param": "updated_at"
      },
      "system_item_id": {
        "param": "system_item_id",
        "optional": true,
        "allow_null": true
      }
    },
    "returning": [
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
    ]
  },
  {
    "id": "catalog.item.insert.system",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogItem",
    "tenant_scope": "SYSTEM",
    "values": {
      "type_id": {
        "param": "type_id"
      },
      "version_group_id": {
        "param": "version_group_id"
      },
      "version": {
        "param": "version"
      },
      "code": {
        "param": "code"
      },
      "name": {
        "param": "name"
      },
      "name_en": {
        "param": "name_en",
        "optional": true,
        "allow_null": true
      },
      "description": {
        "param": "description",
        "optional": true,
        "allow_null": true
      },
      "attributes": {
        "param": "attributes",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      },
      "valid_from": {
        "param": "valid_from"
      },
      "valid_to": {
        "param": "valid_to",
        "optional": true,
        "allow_null": true
      },
      "supersedes_item_id": {
        "param": "supersedes_item_id",
        "optional": true,
        "allow_null": true
      },
      "created_by": {
        "param": "created_by",
        "optional": true,
        "allow_null": true
      },
      "created_at": {
        "param": "created_at"
      },
      "updated_by": {
        "param": "updated_by",
        "optional": true,
        "allow_null": true
      },
      "updated_at": {
        "param": "updated_at"
      }
    },
    "returning": [
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
    ]
  },
  {
    "id": "catalog.item.close",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
    "values": {
      "valid_to": {
        "param": "valid_to"
      },
      "updated_at": {
        "param": "updated_at"
      },
      "updated_by": {
        "param": "updated_by",
        "optional": true,
        "allow_null": true
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.item.close.system",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogItem",
    "tenant_scope": "SYSTEM",
    "values": {
      "valid_to": {
        "param": "valid_to"
      },
      "updated_at": {
        "param": "updated_at"
      },
      "updated_by": {
        "param": "updated_by",
        "optional": true,
        "allow_null": true
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.item.current.by.code",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
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
        "field": "valid_to",
        "op": "IS_NULL"
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
    "id": "catalog.item.current.by.code.system",
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
        "field": "tenant_id",
        "op": "IS_NULL"
      },
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
        "field": "valid_to",
        "op": "IS_NULL"
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
    "id": "catalog.item.visible.current.by.code",
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
        "op": "LOWER_EQ",
        "param": "code",
        "required": true
      },
      {
        "field": "valid_to",
        "op": "IS_NULL"
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
    "id": "catalog.item.visible.current.by.name",
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
        "field": "name",
        "op": "LOWER_EQ",
        "param": "name",
        "required": true
      },
      {
        "field": "valid_to",
        "op": "IS_NULL"
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
    "id": "catalog.edge.insert",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
    "values": {
      "parent_item_id": {
        "param": "parent_item_id"
      },
      "child_item_id": {
        "param": "child_item_id"
      },
      "relation_type": {
        "param": "relation_type"
      },
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      },
      "valid_from": {
        "param": "valid_from"
      },
      "created_by": {
        "param": "created_by",
        "optional": true,
        "allow_null": true
      },
      "created_at": {
        "param": "created_at"
      },
      "system_edge_id": {
        "param": "system_edge_id",
        "optional": true,
        "allow_null": true
      },
      "valid_to": {
        "param": "valid_to",
        "optional": true,
        "allow_null": true
      }
    },
    "returning": [
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
    ]
  },
  {
    "id": "catalog.edge.insert.system",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogItemEdge",
    "tenant_scope": "SYSTEM",
    "values": {
      "parent_item_id": {
        "param": "parent_item_id"
      },
      "child_item_id": {
        "param": "child_item_id"
      },
      "relation_type": {
        "param": "relation_type"
      },
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      },
      "valid_from": {
        "param": "valid_from"
      },
      "created_by": {
        "param": "created_by",
        "optional": true,
        "allow_null": true
      },
      "created_at": {
        "param": "created_at"
      }
    },
    "returning": [
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
    ]
  },
  {
    "id": "catalog.edge.close",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
    "values": {
      "valid_to": {
        "param": "valid_to"
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.edge.close.system",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogItemEdge",
    "tenant_scope": "SYSTEM",
    "values": {
      "valid_to": {
        "param": "valid_to"
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.edge.by.id",
    "mode": "READ",
    "operation": "GET",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
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
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ]
  },
  {
    "id": "catalog.edge.by.id.system",
    "mode": "READ",
    "operation": "GET",
    "entity": "CatalogItemEdge",
    "tenant_scope": "SYSTEM",
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
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ]
  },
  {
    "id": "catalog.edge.active",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
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
        "field": "child_item_id",
        "op": "EQ",
        "param": "child_item_id",
        "required": true
      },
      {
        "field": "relation_type",
        "op": "EQ",
        "param": "relation_type",
        "required": true
      },
      {
        "field": "valid_to",
        "op": "IS_NULL"
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
    "id": "catalog.edge.active.system",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "SYSTEM",
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
        "field": "child_item_id",
        "op": "EQ",
        "param": "child_item_id",
        "required": true
      },
      {
        "field": "relation_type",
        "op": "EQ",
        "param": "relation_type",
        "required": true
      },
      {
        "field": "valid_to",
        "op": "IS_NULL"
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
    "id": "catalog.edges.current.by.child",
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
        "param": "status",
        "required": true
      },
      {
        "field": "valid_to",
        "op": "IS_NULL"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 1000,
      "defaultSize": 1000
    },
    "maxRows": 1000
  },
  {
    "id": "catalog.items.export",
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
      "maxSize": 20000,
      "defaultSize": 20000
    },
    "maxRows": 20000,
    "bulk": true
  },
  {
    "id": "catalog.edges.by.children.export",
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
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 20000,
      "defaultSize": 20000
    },
    "maxRows": 20000,
    "bulk": true
  },
  {
    "id": "catalog.items.by.ids.export",
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
      "maxSize": 20000,
      "defaultSize": 20000
    },
    "maxRows": 20000,
    "bulk": true
  },
  {
    "id": "catalog.items.descendants",
    "mode": "READ",
    "operation": "TREE",
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
    "tree": {
      "edge_entity": "CatalogItemEdge",
      "root_param": "root_id",
      "parent_field": "parent_item_id",
      "child_field": "child_item_id",
      "effective_param": "as_of",
      "depth_param": "max_depth",
      "default_depth": 100,
      "max_depth": 1000,
      "status": "ACTIVE"
    },
    "maxRows": 20000,
    "bulk": true
  },
  {
    "id": "catalog.items.system.index",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "type_id",
      "code"
    ],
    "filters": [
      {
        "field": "tenant_id",
        "op": "IS_NULL"
      },
      {
        "field": "valid_to",
        "op": "IS_NULL"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 20000,
      "defaultSize": 20000
    },
    "maxRows": 20000,
    "bulk": true
  },
  {
    "id": "catalog.edges.system.index",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "parent_item_id",
      "child_item_id",
      "relation_type",
      "sort_order",
      "status"
    ],
    "filters": [
      {
        "field": "tenant_id",
        "op": "IS_NULL"
      },
      {
        "field": "valid_to",
        "op": "IS_NULL"
      },
      {
        "field": "relation_type",
        "op": "EQ",
        "param": "relation_type"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 20000,
      "defaultSize": 20000
    },
    "maxRows": 20000,
    "bulk": true
  },
  {
    "id": "catalog.type.insert.mirror",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogType",
    "tenant_scope": "TENANT",
    "values": {
      "code": {
        "param": "code"
      },
      "name_key": {
        "param": "name_key"
      },
      "description_key": {
        "param": "description_key",
        "optional": true,
        "allow_null": true
      },
      "hierarchy_mode": {
        "param": "hierarchy_mode",
        "optional": true
      },
      "allowed_relations": {
        "param": "allowed_relations",
        "type": "varchar[]",
        "optional": true
      },
      "allowed_parent_types": {
        "param": "allowed_parent_types",
        "type": "varchar[]",
        "optional": true,
        "allow_null": true
      },
      "max_depth": {
        "param": "max_depth",
        "optional": true,
        "allow_null": true
      },
      "min_parents": {
        "param": "min_parents",
        "optional": true
      },
      "allow_free_text": {
        "param": "allow_free_text",
        "optional": true
      },
      "versioned": {
        "param": "versioned",
        "optional": true
      },
      "effective_dated": {
        "param": "effective_dated",
        "optional": true
      },
      "attributes_schema": {
        "param": "attributes_schema",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      }
    },
    "returning": [
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
    "system_row": true
  },
  {
    "id": "catalog.type.update.mirror",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogType",
    "tenant_scope": "TENANT",
    "values": {
      "code": {
        "param": "code"
      },
      "name_key": {
        "param": "name_key"
      },
      "description_key": {
        "param": "description_key",
        "optional": true,
        "allow_null": true
      },
      "hierarchy_mode": {
        "param": "hierarchy_mode",
        "optional": true
      },
      "allowed_relations": {
        "param": "allowed_relations",
        "type": "varchar[]",
        "optional": true
      },
      "allowed_parent_types": {
        "param": "allowed_parent_types",
        "type": "varchar[]",
        "optional": true,
        "allow_null": true
      },
      "max_depth": {
        "param": "max_depth",
        "optional": true,
        "allow_null": true
      },
      "min_parents": {
        "param": "min_parents",
        "optional": true
      },
      "allow_free_text": {
        "param": "allow_free_text",
        "optional": true
      },
      "versioned": {
        "param": "versioned",
        "optional": true
      },
      "effective_dated": {
        "param": "effective_dated",
        "optional": true
      },
      "attributes_schema": {
        "param": "attributes_schema",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    "system_row": true
  },
  {
    "id": "catalog.item.insert.mirror",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
    "values": {
      "type_id": {
        "param": "type_id"
      },
      "version_group_id": {
        "param": "version_group_id"
      },
      "version": {
        "param": "version"
      },
      "code": {
        "param": "code"
      },
      "name": {
        "param": "name"
      },
      "name_en": {
        "param": "name_en",
        "optional": true,
        "allow_null": true
      },
      "description": {
        "param": "description",
        "optional": true,
        "allow_null": true
      },
      "attributes": {
        "param": "attributes",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      },
      "valid_from": {
        "param": "valid_from"
      },
      "valid_to": {
        "param": "valid_to",
        "optional": true,
        "allow_null": true
      },
      "supersedes_item_id": {
        "param": "supersedes_item_id",
        "optional": true,
        "allow_null": true
      },
      "created_by": {
        "param": "created_by",
        "optional": true,
        "allow_null": true
      },
      "created_at": {
        "param": "created_at"
      },
      "updated_by": {
        "param": "updated_by",
        "optional": true,
        "allow_null": true
      },
      "updated_at": {
        "param": "updated_at"
      }
    },
    "returning": [
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
    "system_row": true
  },
  {
    "id": "catalog.edge.insert.mirror",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
    "values": {
      "parent_item_id": {
        "param": "parent_item_id"
      },
      "child_item_id": {
        "param": "child_item_id"
      },
      "relation_type": {
        "param": "relation_type"
      },
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      },
      "valid_from": {
        "param": "valid_from"
      },
      "created_by": {
        "param": "created_by",
        "optional": true,
        "allow_null": true
      },
      "created_at": {
        "param": "created_at"
      }
    },
    "returning": [
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
    "system_row": true
  },
  {
    "id": "catalog.item.update.mirror",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
    "system_row": true,
    "values": {
      "name": {
        "param": "name"
      },
      "name_en": {
        "param": "name_en",
        "optional": true,
        "allow_null": true
      },
      "description": {
        "param": "description",
        "optional": true,
        "allow_null": true
      },
      "attributes": {
        "param": "attributes",
        "type": "jsonb",
        "optional": true,
        "allow_null": true
      },
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      },
      "updated_at": {
        "param": "updated_at"
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.edge.update.mirror",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
    "system_row": true,
    "values": {
      "sort_order": {
        "param": "sort_order"
      },
      "status": {
        "param": "status"
      }
    },
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
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
    ]
  },
  {
    "id": "catalog.type.relations.parents",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "parent_type_id",
      "child_type_id",
      "relation_type",
      "sort_order",
      "status",
      "created_at",
      "updated_at",
      "system_relation_id"
    ],
    "filters": [
      {
        "field": "child_type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "relation_type",
        "direction": "ASC"
      },
      {
        "field": "sort_order",
        "direction": "ASC"
      },
      {
        "field": "created_at",
        "direction": "ASC"
      }
    ],
    "maxRows": 2000
  },
  {
    "id": "catalog.type.relations.children",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "parent_type_id",
      "child_type_id",
      "relation_type",
      "sort_order",
      "status",
      "created_at",
      "updated_at",
      "system_relation_id"
    ],
    "filters": [
      {
        "field": "parent_type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      }
    ],
    "sort": [
      {
        "field": "relation_type",
        "direction": "ASC"
      },
      {
        "field": "sort_order",
        "direction": "ASC"
      },
      {
        "field": "created_at",
        "direction": "ASC"
      }
    ],
    "maxRows": 2000
  },
  {
    "id": "catalog.type.relation.delete.parents",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "TENANT",
    "filters": [
      {
        "field": "child_type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "relation_type",
        "op": "EQ",
        "param": "relation_type",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.type.relation.delete.children",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "TENANT",
    "filters": [
      {
        "field": "parent_type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "relation_type",
        "op": "EQ",
        "param": "relation_type",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.type.relation.delete.parents.system",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "SYSTEM",
    "filters": [
      {
        "field": "child_type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "relation_type",
        "op": "EQ",
        "param": "relation_type",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.type.relation.delete.children.system",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "SYSTEM",
    "filters": [
      {
        "field": "parent_type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      },
      {
        "field": "relation_type",
        "op": "EQ",
        "param": "relation_type",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.type.relation.insert",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "TENANT",
    "values": {
      "parent_type_id": {
        "param": "parent_type_id"
      },
      "child_type_id": {
        "param": "child_type_id"
      },
      "relation_type": {
        "param": "relation_type"
      },
      "sort_order": {
        "param": "sort_order",
        "optional": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "created_at": {
        "param": "created_at",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      },
      "system_relation_id": {
        "param": "system_relation_id",
        "optional": true,
        "allow_null": true
      }
    },
    "returning": [
      "id",
      "tenant_id",
      "parent_type_id",
      "child_type_id",
      "relation_type",
      "sort_order",
      "status",
      "created_at",
      "updated_at"
    ]
  },
  {
    "id": "catalog.type.relation.insert.system",
    "mode": "WRITE",
    "operation": "INSERT",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "SYSTEM",
    "values": {
      "parent_type_id": {
        "param": "parent_type_id"
      },
      "child_type_id": {
        "param": "child_type_id"
      },
      "relation_type": {
        "param": "relation_type"
      },
      "sort_order": {
        "param": "sort_order",
        "optional": true
      },
      "status": {
        "param": "status",
        "optional": true
      },
      "created_at": {
        "param": "created_at",
        "optional": true
      },
      "updated_at": {
        "param": "updated_at",
        "optional": true
      }
    },
    "returning": [
      "id",
      "tenant_id",
      "parent_type_id",
      "child_type_id",
      "relation_type",
      "sort_order",
      "status",
      "created_at",
      "updated_at"
    ]
  },
  {
    "id": "catalog.type.relations.all",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogTypeRelation",
    "tenant_scope": "TENANT_OR_SYSTEM",
    "select": [
      "id",
      "tenant_id",
      "parent_type_id",
      "child_type_id",
      "relation_type",
      "sort_order",
      "status",
      "created_at",
      "updated_at",
      "system_relation_id"
    ],
    "sort": [
      {
        "field": "relation_type",
        "direction": "ASC"
      }
    ],
    "maxRows": 20000
  },
  {
    "id": "catalog.clone.items.system",
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
      "updated_by",
      "system_item_id"
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
        "field": "version_group_id",
        "direction": "ASC"
      },
      {
        "field": "version",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 20000,
      "defaultSize": 2000
    },
    "maxRows": 20000
  },
  {
    "id": "catalog.clone.items.tenant",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
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
      "updated_by",
      "system_item_id"
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
        "field": "version_group_id",
        "direction": "ASC"
      },
      {
        "field": "version",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 20000,
      "defaultSize": 2000
    },
    "maxRows": 20000
  },
  {
    "id": "catalog.clone.edges.system",
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
      "created_by",
      "system_edge_id"
    ],
    "sort": [
      {
        "field": "created_at",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 20000,
      "defaultSize": 2000
    },
    "maxRows": 20000
  },
  {
    "id": "catalog.clone.edges.tenant",
    "mode": "READ",
    "operation": "LIST",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
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
      "created_by",
      "system_edge_id"
    ],
    "sort": [
      {
        "field": "created_at",
        "direction": "ASC"
      }
    ],
    "page": {
      "pageParam": "page",
      "sizeParam": "size",
      "maxSize": 20000,
      "defaultSize": 2000
    },
    "maxRows": 20000
  },
  {
    "id": "catalog.clone.item.delete.by.type",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "type_id",
        "required": true
      }
    ],
    "returning": [
      "id"
    ],
    "timeoutMs": 30000,
    "bulk": true
  },
  {
    "id": "catalog.clone.edge.delete.by.parents",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
    "filters": [
      {
        "field": "parent_item_id",
        "op": "IN",
        "param": "parent_item_ids",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.clone.edge.delete.by.children",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogItemEdge",
    "tenant_scope": "TENANT",
    "filters": [
      {
        "field": "child_item_id",
        "op": "IN",
        "param": "child_item_ids",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.clone.type.delete",
    "mode": "WRITE",
    "operation": "DELETE",
    "entity": "CatalogType",
    "tenant_scope": "TENANT",
    "filters": [
      {
        "field": "id",
        "op": "EQ",
        "param": "id",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  },
  {
    "id": "catalog.clone.item.move.type",
    "mode": "WRITE",
    "operation": "UPDATE",
    "entity": "CatalogItem",
    "tenant_scope": "TENANT",
    "values": {
      "type_id": {
        "param": "to_type_id"
      }
    },
    "filters": [
      {
        "field": "type_id",
        "op": "EQ",
        "param": "from_type_id",
        "required": true
      }
    ],
    "returning": [
      "id"
    ]
  }
]$queries$::jsonb AS queries
)
UPDATE plugin_versions pv
SET manifest = jsonb_set(pv.manifest, '{queries}', payload.queries, true)
FROM plugin_catalog pc
CROSS JOIN payload
WHERE pv.catalog_id = pc.id
  AND pc.plugin_key = 'catalog'
  AND pv.version = '1.0.0';
