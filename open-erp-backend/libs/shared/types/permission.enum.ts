/**
 * Permission Registry
 * Centralized list of all permissions in the system
 * Format: resource.action
 */
export enum Permission {
  // User Management
  USER_CREATE = 'user.create',
  USER_READ = 'user.read',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_MANAGE = 'user.manage', // Full user management

  // Tenant Management (Legacy - for backward compatibility with old data)
  // Use ORGANIZATION_* permissions for new code
  TENANT_CREATE = 'tenant.create',
  TENANT_READ = 'tenant.read',
  TENANT_UPDATE = 'tenant.update',
  TENANT_DELETE = 'tenant.delete',
  TENANT_MANAGE = 'tenant.manage', // Full tenant management

  // Organization Management (Preferred)
  ORGANIZATION_CREATE = 'organization.create',
  ORGANIZATION_READ = 'organization.read',
  ORGANIZATION_UPDATE = 'organization.update',
  ORGANIZATION_DELETE = 'organization.delete',
  ORGANIZATION_MANAGE = 'organization.manage', // Full organization management
  ORGANIZATION_INVITE = 'organization.invite', // Invite users to organization
  ORGANIZATION_MEMBER_UPDATE = 'organization.member.update', // Update member roles/status
  ORGANIZATION_MEMBER_REMOVE = 'organization.member.remove', // Remove members from organization

  // Organization Admin Permissions
  MANAGE_USERS_AND_ORGS = 'organization.manage_users_and_orgs', // System-wide: manage users and orgs
  MANAGE_ORG_USERS = 'organization.manage_org_users', // Org-level: manage users within an org

  // Role Management
  ROLE_CREATE = 'role.create',
  ROLE_READ = 'role.read',
  ROLE_UPDATE = 'role.update',
  ROLE_DELETE = 'role.delete',
  ROLE_MANAGE = 'role.manage', // Full role management
  ROLE_ASSIGN = 'role.assign', // Assign roles to users

  // Department Management
  DEPARTMENT_CREATE = 'department.create',
  DEPARTMENT_READ = 'department.read',
  DEPARTMENT_UPDATE = 'department.update',
  DEPARTMENT_DELETE = 'department.delete',
  DEPARTMENT_MANAGE = 'department.manage',

  // System Administration
  SYSTEM_ADMIN = 'system.admin', // Full system access
  SYSTEM_CONFIG = 'system.config', // System configuration
  SYSTEM_LOGS = 'system.logs', // View system logs

  // Order Management (example for ERP)
  ORDER_CREATE = 'order.create',
  ORDER_READ = 'order.read',
  ORDER_UPDATE = 'order.update',
  ORDER_DELETE = 'order.delete',
  ORDER_APPROVE = 'order.approve',
  ORDER_MANAGE = 'order.manage',

  // Product Management (example for ERP)
  PRODUCT_CREATE = 'product.create',
  PRODUCT_READ = 'product.read',
  PRODUCT_UPDATE = 'product.update',
  PRODUCT_DELETE = 'product.delete',
  PRODUCT_MANAGE = 'product.manage',

  // Product Type Management
  PRODUCT_TYPE_CREATE = 'product_type.create',
  PRODUCT_TYPE_READ = 'product_type.read',
  PRODUCT_TYPE_UPDATE = 'product_type.update',
  PRODUCT_TYPE_DELETE = 'product_type.delete',
  MANAGE_PRODUCT_TYPE = 'product_type.manage',

  // Product Category Management
  PRODUCT_CATEGORY_CREATE = 'product_category.create',
  PRODUCT_CATEGORY_READ = 'product_category.read',
  PRODUCT_CATEGORY_UPDATE = 'product_category.update',
  PRODUCT_CATEGORY_DELETE = 'product_category.delete',
  MANAGE_PRODUCT_CATEGORY = 'product_category.manage',

  // Report Access
  REPORT_VIEW = 'report.view',
  REPORT_EXPORT = 'report.export',
  REPORT_MANAGE = 'report.manage',

  // Navigation Management
  NAVIGATION_READ = 'navigation.read',
  NAVIGATION_CREATE = 'navigation.create',
  NAVIGATION_UPDATE = 'navigation.update',
  NAVIGATION_DELETE = 'navigation.delete',
  NAVIGATION_MANAGE = 'navigation.manage', // Full navigation management

  // Configuration Management
  CONFIG_READ = 'config.read',
  CONFIG_CREATE = 'config.create',
  CONFIG_UPDATE = 'config.update',
  CONFIG_DELETE = 'config.delete',
  CONFIG_MANAGE = 'config.manage',

  // Warehouse Management
  WAREHOUSE_CREATE = 'warehouse.create',
  WAREHOUSE_READ = 'warehouse.read',
  WAREHOUSE_UPDATE = 'warehouse.update',
  WAREHOUSE_DELETE = 'warehouse.delete',
  WAREHOUSE_MANAGE = 'warehouse.manage',

  // Inventory Location Management
  INVENTORY_WAREHOUSE_CREATE = 'inventory.warehouse.create',
  INVENTORY_WAREHOUSE_READ = 'inventory.warehouse.read',
  INVENTORY_WAREHOUSE_UPDATE = 'inventory.warehouse.update',
  INVENTORY_WAREHOUSE_DELETE = 'inventory.warehouse.delete',
  INVENTORY_ZONE_CREATE = 'inventory.zone.create',
  INVENTORY_ZONE_READ = 'inventory.zone.read',
  INVENTORY_ZONE_UPDATE = 'inventory.zone.update',
  INVENTORY_ZONE_DELETE = 'inventory.zone.delete',
  INVENTORY_AISLE_CREATE = 'inventory.aisle.create',
  INVENTORY_AISLE_READ = 'inventory.aisle.read',
  INVENTORY_AISLE_UPDATE = 'inventory.aisle.update',
  INVENTORY_AISLE_DELETE = 'inventory.aisle.delete',
  INVENTORY_BIN_CREATE = 'inventory.bin.create',
  INVENTORY_BIN_READ = 'inventory.bin.read',
  INVENTORY_BIN_UPDATE = 'inventory.bin.update',
  INVENTORY_BIN_DELETE = 'inventory.bin.delete',
  INVENTORY_BIN_IMPORT = 'inventory.bin.import',
  INVENTORY_BIN_EXPORT = 'inventory.bin.export',

  // Stock Management
  INVENTORY_STOCK_VIEW = 'inventory.stock.view',
  INVENTORY_STOCK_MANAGE = 'inventory.stock.manage',
  INVENTORY_ALLOCATION_MANAGE = 'inventory.allocation.manage',
  INVENTORY_LOT_MANAGE = 'inventory.lot.manage',
  INVENTORY_SERIAL_MANAGE = 'inventory.serial.manage',

  // Import/Export Management
  IMPORT_EXPORT_MANAGE = 'import.export.manage',
  IMPORT_EXPORT_EXPORT = 'import.export.export',
  IMPORT_EXPORT_IMPORT = 'import.export.import',

  // WMS (Warehouse Management System) Permissions
  WMS_RECEIPT_CREATE = 'wms.receipt.create',
  WMS_RECEIPT_READ = 'wms.receipt.read',
  WMS_RECEIPT_UPDATE = 'wms.receipt.update',
  WMS_RECEIPT_REVIEW = 'wms.receipt.review',
  WMS_RECEIPT_APPROVE = 'wms.receipt.approve',
  WMS_RECEIPT_FINALIZE = 'wms.receipt.finalize',
  WMS_QC_MANAGE = 'wms.qc.manage',
  WMS_PICK_MANAGE = 'wms.pick.manage',
  WMS_PACK_MANAGE = 'wms.pack.manage',
  WMS_SHIP_MANAGE = 'wms.ship.manage',

  // Approval Workflow Management
  APPROVAL_TEMPLATE_CREATE = 'approval.template.create',
  APPROVAL_TEMPLATE_READ = 'approval.template.read',
  APPROVAL_TEMPLATE_UPDATE = 'approval.template.update',
  APPROVAL_TEMPLATE_DELETE = 'approval.template.delete',
  APPROVAL_TEMPLATE_MANAGE = 'approval.template.manage',
  APPROVAL_REQUEST_CREATE = 'approval.request.create',
  APPROVAL_REQUEST_READ = 'approval.request.read',
  APPROVAL_REQUEST_ACTION = 'approval.request.action',
  APPROVAL_REQUEST_MANAGE = 'approval.request.manage',
}

/**
 * Helper function to get all permissions as strings
 */
export function getAllPermissions(): string[] {
  return Object.values(Permission);
}

/**
 * Helper function to validate if a permission exists
 */
export function isValidPermission(permission: string): boolean {
  return getAllPermissions().includes(permission);
}

/**
 * Permission groups for easier role creation
 */
export const PermissionGroups = {
  USER_FULL: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
  ],
  // Legacy - kept for backward compatibility with existing data
  TENANT_FULL: [
    Permission.TENANT_CREATE,
    Permission.TENANT_READ,
    Permission.TENANT_UPDATE,
    Permission.TENANT_DELETE,
  ],
  // Preferred for new code
  ORGANIZATION_FULL: [
    Permission.ORGANIZATION_CREATE,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_UPDATE,
    Permission.ORGANIZATION_DELETE,
    Permission.ORGANIZATION_INVITE,
    Permission.ORGANIZATION_MEMBER_UPDATE,
    Permission.ORGANIZATION_MEMBER_REMOVE,
    Permission.MANAGE_USERS_AND_ORGS,
    Permission.MANAGE_ORG_USERS,
  ],
  ROLE_FULL: [
    Permission.ROLE_CREATE,
    Permission.ROLE_READ,
    Permission.ROLE_UPDATE,
    Permission.ROLE_DELETE,
    Permission.ROLE_ASSIGN,
  ],
  DEPARTMENT_FULL: [
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,
  ],
  ORDER_FULL: [
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_APPROVE,
  ],
  PRODUCT_FULL: [
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
  ],
  PRODUCT_TYPE_FULL: [
    Permission.PRODUCT_TYPE_CREATE,
    Permission.PRODUCT_TYPE_READ,
    Permission.PRODUCT_TYPE_UPDATE,
    Permission.PRODUCT_TYPE_DELETE,
  ],
  PRODUCT_CATEGORY_FULL: [
    Permission.PRODUCT_CATEGORY_CREATE,
    Permission.PRODUCT_CATEGORY_READ,
    Permission.PRODUCT_CATEGORY_UPDATE,
    Permission.PRODUCT_CATEGORY_DELETE,
  ],
  REPORT_FULL: [
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_MANAGE,
  ],
  NAVIGATION_FULL: [
    Permission.NAVIGATION_CREATE,
    Permission.NAVIGATION_READ,
    Permission.NAVIGATION_UPDATE,
    Permission.NAVIGATION_DELETE,
  ],
  CONFIG_FULL: [
    Permission.CONFIG_CREATE,
    Permission.CONFIG_READ,
    Permission.CONFIG_UPDATE,
    Permission.CONFIG_DELETE,
  ],
  INVENTORY_STOCK_FULL: [
    Permission.INVENTORY_STOCK_VIEW,
    Permission.INVENTORY_STOCK_MANAGE,
    Permission.INVENTORY_ALLOCATION_MANAGE,
    Permission.INVENTORY_LOT_MANAGE,
    Permission.INVENTORY_SERIAL_MANAGE,
  ],
  IMPORT_EXPORT_FULL: [
    Permission.IMPORT_EXPORT_MANAGE,
    Permission.IMPORT_EXPORT_EXPORT,
    Permission.IMPORT_EXPORT_IMPORT,
  ],
  WMS_FULL: [
    Permission.WMS_RECEIPT_CREATE,
    Permission.WMS_RECEIPT_READ,
    Permission.WMS_RECEIPT_UPDATE,
    Permission.WMS_RECEIPT_REVIEW,
    Permission.WMS_RECEIPT_APPROVE,
    Permission.WMS_RECEIPT_FINALIZE,
    Permission.WMS_QC_MANAGE,
    Permission.WMS_PICK_MANAGE,
    Permission.WMS_PACK_MANAGE,
    Permission.WMS_SHIP_MANAGE,
  ],
  APPROVAL_TEMPLATE_FULL: [
    Permission.APPROVAL_TEMPLATE_CREATE,
    Permission.APPROVAL_TEMPLATE_READ,
    Permission.APPROVAL_TEMPLATE_UPDATE,
    Permission.APPROVAL_TEMPLATE_DELETE,
    Permission.APPROVAL_TEMPLATE_MANAGE,
  ],
  APPROVAL_REQUEST_FULL: [
    Permission.APPROVAL_REQUEST_CREATE,
    Permission.APPROVAL_REQUEST_READ,
    Permission.APPROVAL_REQUEST_ACTION,
    Permission.APPROVAL_REQUEST_MANAGE,
  ],
};

/**
 * Permission metadata with descriptions and scope information
 */
export const PermissionMetadata: Record<
  string,
  { description: string; scope: 'global' | 'organization' }
> = {
  // User Management
  [Permission.USER_CREATE]: {
    description: 'Permission to create new users',
    scope: 'global',
  },
  [Permission.USER_READ]: {
    description: 'Permission to view user information',
    scope: 'global',
  },
  [Permission.USER_UPDATE]: {
    description: 'Permission to update user information',
    scope: 'global',
  },
  [Permission.USER_DELETE]: {
    description: 'Permission to delete users',
    scope: 'global',
  },
  [Permission.USER_MANAGE]: {
    description: 'Full user management permissions',
    scope: 'global',
  },

  // Tenant Management (Legacy)
  [Permission.TENANT_CREATE]: {
    description: 'Permission to create tenants (legacy)',
    scope: 'organization',
  },
  [Permission.TENANT_READ]: {
    description: 'Permission to view tenant information (legacy)',
    scope: 'organization',
  },
  [Permission.TENANT_UPDATE]: {
    description: 'Permission to update tenant information (legacy)',
    scope: 'organization',
  },
  [Permission.TENANT_DELETE]: {
    description: 'Permission to delete tenants (legacy)',
    scope: 'organization',
  },
  [Permission.TENANT_MANAGE]: {
    description: 'Full tenant management permissions (legacy)',
    scope: 'organization',
  },

  // Organization Management
  [Permission.ORGANIZATION_CREATE]: {
    description: 'Permission to create organizations',
    scope: 'organization',
  },
  [Permission.ORGANIZATION_READ]: {
    description: 'Permission to view organization information',
    scope: 'organization',
  },
  [Permission.ORGANIZATION_UPDATE]: {
    description: 'Permission to update organization information',
    scope: 'organization',
  },
  [Permission.ORGANIZATION_DELETE]: {
    description: 'Permission to delete organizations',
    scope: 'organization',
  },
  [Permission.ORGANIZATION_MANAGE]: {
    description: 'Full organization management permissions',
    scope: 'organization',
  },
  [Permission.ORGANIZATION_INVITE]: {
    description: 'Permission to invite users to organization',
    scope: 'organization',
  },
  [Permission.ORGANIZATION_MEMBER_UPDATE]: {
    description: 'Permission to update member roles and status',
    scope: 'organization',
  },
  [Permission.ORGANIZATION_MEMBER_REMOVE]: {
    description: 'Permission to remove members from organization',
    scope: 'organization',
  },
  [Permission.MANAGE_USERS_AND_ORGS]: {
    description: 'System-wide permission to manage users and organizations',
    scope: 'global',
  },
  [Permission.MANAGE_ORG_USERS]: {
    description:
      'Organization-level permission to manage users within an organization',
    scope: 'organization',
  },

  // Role Management
  [Permission.ROLE_CREATE]: {
    description: 'Permission to create roles',
    scope: 'global',
  },
  [Permission.ROLE_READ]: {
    description: 'Permission to view role information',
    scope: 'global',
  },
  [Permission.ROLE_UPDATE]: {
    description: 'Permission to update roles',
    scope: 'global',
  },
  [Permission.ROLE_DELETE]: {
    description: 'Permission to delete roles',
    scope: 'global',
  },
  [Permission.ROLE_MANAGE]: {
    description: 'Full role management permissions',
    scope: 'global',
  },
  [Permission.ROLE_ASSIGN]: {
    description: 'Permission to assign roles to users',
    scope: 'global',
  },

  // Department Management
  [Permission.DEPARTMENT_CREATE]: {
    description: 'Permission to create departments',
    scope: 'organization',
  },
  [Permission.DEPARTMENT_READ]: {
    description: 'Permission to view department information',
    scope: 'organization',
  },
  [Permission.DEPARTMENT_UPDATE]: {
    description: 'Permission to update departments',
    scope: 'organization',
  },
  [Permission.DEPARTMENT_DELETE]: {
    description: 'Permission to delete departments',
    scope: 'organization',
  },
  [Permission.DEPARTMENT_MANAGE]: {
    description: 'Full department management permissions',
    scope: 'organization',
  },

  // System Administration
  [Permission.SYSTEM_ADMIN]: {
    description: 'Full system access',
    scope: 'global',
  },
  [Permission.SYSTEM_CONFIG]: {
    description: 'System configuration access',
    scope: 'global',
  },
  [Permission.SYSTEM_LOGS]: {
    description: 'View system logs',
    scope: 'global',
  },

  // Order Management
  [Permission.ORDER_CREATE]: {
    description: 'Permission to create orders',
    scope: 'organization',
  },
  [Permission.ORDER_READ]: {
    description: 'Permission to view order information',
    scope: 'organization',
  },
  [Permission.ORDER_UPDATE]: {
    description: 'Permission to update orders',
    scope: 'organization',
  },
  [Permission.ORDER_DELETE]: {
    description: 'Permission to delete orders',
    scope: 'organization',
  },
  [Permission.ORDER_APPROVE]: {
    description: 'Permission to approve orders',
    scope: 'organization',
  },
  [Permission.ORDER_MANAGE]: {
    description: 'Full order management permissions',
    scope: 'organization',
  },

  // Product Management
  [Permission.PRODUCT_CREATE]: {
    description: 'Permission to create products',
    scope: 'organization',
  },
  [Permission.PRODUCT_READ]: {
    description: 'Permission to view product information',
    scope: 'organization',
  },
  [Permission.PRODUCT_UPDATE]: {
    description: 'Permission to update products',
    scope: 'organization',
  },
  [Permission.PRODUCT_DELETE]: {
    description: 'Permission to delete products',
    scope: 'organization',
  },
  [Permission.PRODUCT_MANAGE]: {
    description: 'Full product management permissions',
    scope: 'organization',
  },

  // Product Type Management
  [Permission.PRODUCT_TYPE_CREATE]: {
    description: 'Permission to create product types',
    scope: 'organization',
  },
  [Permission.PRODUCT_TYPE_READ]: {
    description: 'Permission to view product type information',
    scope: 'organization',
  },
  [Permission.PRODUCT_TYPE_UPDATE]: {
    description: 'Permission to update product types',
    scope: 'organization',
  },
  [Permission.PRODUCT_TYPE_DELETE]: {
    description: 'Permission to delete product types',
    scope: 'organization',
  },
  [Permission.MANAGE_PRODUCT_TYPE]: {
    description: 'Full product type management permissions',
    scope: 'organization',
  },

  // Product Category Management
  [Permission.PRODUCT_CATEGORY_CREATE]: {
    description: 'Permission to create product categories',
    scope: 'organization',
  },
  [Permission.PRODUCT_CATEGORY_READ]: {
    description: 'Permission to view product category information',
    scope: 'organization',
  },
  [Permission.PRODUCT_CATEGORY_UPDATE]: {
    description: 'Permission to update product categories',
    scope: 'organization',
  },
  [Permission.PRODUCT_CATEGORY_DELETE]: {
    description: 'Permission to delete product categories',
    scope: 'organization',
  },
  [Permission.MANAGE_PRODUCT_CATEGORY]: {
    description: 'Full product category management permissions',
    scope: 'organization',
  },

  // Report Access
  [Permission.REPORT_VIEW]: {
    description: 'Permission to view reports',
    scope: 'organization',
  },
  [Permission.REPORT_EXPORT]: {
    description: 'Permission to export reports',
    scope: 'organization',
  },
  [Permission.REPORT_MANAGE]: {
    description: 'Full report management permissions',
    scope: 'organization',
  },

  // Navigation Management
  [Permission.NAVIGATION_READ]: {
    description: 'Permission to view navigation items',
    scope: 'global',
  },
  [Permission.NAVIGATION_CREATE]: {
    description: 'Permission to create navigation items',
    scope: 'global',
  },
  [Permission.NAVIGATION_UPDATE]: {
    description: 'Permission to update navigation items',
    scope: 'global',
  },
  [Permission.NAVIGATION_DELETE]: {
    description: 'Permission to delete navigation items',
    scope: 'global',
  },
  [Permission.NAVIGATION_MANAGE]: {
    description: 'Full navigation management permissions',
    scope: 'global',
  },

  // Configuration Management
  [Permission.CONFIG_READ]: {
    description: 'Permission to view configuration',
    scope: 'global',
  },
  [Permission.CONFIG_CREATE]: {
    description: 'Permission to create configuration',
    scope: 'global',
  },
  [Permission.CONFIG_UPDATE]: {
    description: 'Permission to update configuration',
    scope: 'global',
  },
  [Permission.CONFIG_DELETE]: {
    description: 'Permission to delete configuration',
    scope: 'global',
  },
  [Permission.CONFIG_MANAGE]: {
    description: 'Full configuration management permissions',
    scope: 'global',
  },

  // Inventory Stock Management
  [Permission.INVENTORY_STOCK_VIEW]: {
    description: 'Permission to view inventory stock levels',
    scope: 'organization',
  },
  [Permission.INVENTORY_STOCK_MANAGE]: {
    description: 'Permission to manage inventory stock (adjust, transfer)',
    scope: 'organization',
  },
  [Permission.INVENTORY_ALLOCATION_MANAGE]: {
    description: 'Permission to manage stock allocations (reserve, release)',
    scope: 'organization',
  },
  [Permission.INVENTORY_LOT_MANAGE]: {
    description: 'Permission to manage inventory lots',
    scope: 'organization',
  },
  [Permission.INVENTORY_SERIAL_MANAGE]: {
    description: 'Permission to manage inventory serial numbers',
    scope: 'organization',
  },
  [Permission.IMPORT_EXPORT_MANAGE]: {
    description: 'Full import/export management permissions',
    scope: 'organization',
  },
  [Permission.IMPORT_EXPORT_EXPORT]: {
    description: 'Permission to export data to Excel/CSV',
    scope: 'organization',
  },
  [Permission.IMPORT_EXPORT_IMPORT]: {
    description: 'Permission to import data from Excel/CSV',
    scope: 'organization',
  },
  // WMS Permissions
  [Permission.WMS_RECEIPT_CREATE]: {
    description: 'Permission to create warehouse receipts (PO receiving)',
    scope: 'organization',
  },
  [Permission.WMS_RECEIPT_READ]: {
    description: 'Permission to view warehouse receipts',
    scope: 'organization',
  },
  [Permission.WMS_RECEIPT_UPDATE]: {
    description:
      'Permission to update warehouse receipts and record received quantities',
    scope: 'organization',
  },
  [Permission.WMS_RECEIPT_REVIEW]: {
    description: 'Permission to review and QC warehouse receipts',
    scope: 'organization',
  },
  [Permission.WMS_RECEIPT_APPROVE]: {
    description: 'Permission to approve warehouse receipts',
    scope: 'organization',
  },
  [Permission.WMS_RECEIPT_FINALIZE]: {
    description: 'Permission to finalize and lock warehouse receipts',
    scope: 'organization',
  },
  [Permission.WMS_QC_MANAGE]: {
    description:
      'Permission to manage QC inspections (pass/fail receipt lines)',
    scope: 'organization',
  },
  [Permission.WMS_PICK_MANAGE]: {
    description: 'Permission to create and manage picklists',
    scope: 'organization',
  },
  [Permission.WMS_PACK_MANAGE]: {
    description: 'Permission to create and manage packages',
    scope: 'organization',
  },
  [Permission.WMS_SHIP_MANAGE]: {
    description: 'Permission to create and manage shipments',
    scope: 'organization',
  },
  // Approval Workflow Permissions
  [Permission.APPROVAL_TEMPLATE_CREATE]: {
    description: 'Permission to create approval workflow templates',
    scope: 'organization',
  },
  [Permission.APPROVAL_TEMPLATE_READ]: {
    description: 'Permission to view approval workflow templates',
    scope: 'organization',
  },
  [Permission.APPROVAL_TEMPLATE_UPDATE]: {
    description: 'Permission to update approval workflow templates',
    scope: 'organization',
  },
  [Permission.APPROVAL_TEMPLATE_DELETE]: {
    description: 'Permission to delete approval workflow templates',
    scope: 'organization',
  },
  [Permission.APPROVAL_TEMPLATE_MANAGE]: {
    description: 'Full approval template management permissions',
    scope: 'organization',
  },
  [Permission.APPROVAL_REQUEST_CREATE]: {
    description: 'Permission to create approval requests',
    scope: 'organization',
  },
  [Permission.APPROVAL_REQUEST_READ]: {
    description: 'Permission to view approval requests',
    scope: 'organization',
  },
  [Permission.APPROVAL_REQUEST_ACTION]: {
    description:
      'Permission to approve, reject, or request changes on approval requests',
    scope: 'organization',
  },
  [Permission.APPROVAL_REQUEST_MANAGE]: {
    description: 'Full approval request management permissions',
    scope: 'organization',
  },
};

/**
 * Get permissions by scope
 */
export function getPermissionsByScope(
  scope: 'global' | 'organization',
): string[] {
  return Object.entries(PermissionMetadata)
    .filter(([_, meta]) => meta.scope === scope)
    .map(([code]) => code);
}

/**
 * Format permission name from code
 * Example: user.create -> User Create
 */
export function formatPermissionName(permissionCode: string): string {
  return permissionCode
    .split('.')
    .map((word) =>
      word
        .split('_')
        .map(
          (subword) =>
            subword.charAt(0).toUpperCase() + subword.slice(1).toLowerCase(),
        )
        .join(' '),
    )
    .join(' ');
}
