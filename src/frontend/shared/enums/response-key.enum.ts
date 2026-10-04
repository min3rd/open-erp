export enum ResponseKey {
  // Identity & User
  USER_ID = 'user_id',
  EMAIL = 'email',
  FULL_NAME = 'full_name',
  PHONE = 'phone',
  STATUS = 'status',
  ROLE = 'role',

  // Generic
  CODE = 'code',
  NAME = 'name',
  DESCRIPTION = 'description',
  TITLE = 'title',
  ADDRESS = 'address',

  // Platform Tenant
  PLAN_TIER = 'plan_tier',
  MAX_USERS = 'max_users',
  MAX_STORAGE_MB = 'max_storage_mb',
  ALLOWED_PLUGINS = 'allowed_plugins',

  // Platform User & Admin
  SUPPORT_TICKET = 'support_ticket',
  CONFIRM_PASSWORD = 'confirm_password',
  REASON = 'reason',
  TARGET_USER_ID = 'target_user_id',

  // Audit Log
  SCOPE = 'scope',

  // IAM
  ROLE_IDS = 'role_ids',
  PERMISSION_IDS = 'permission_ids',
  DESCRIPTION_KEY = 'description_key',
  POLICIES = 'policies',

  // Organization
  BRANCH_ID = 'branch_id',
  DEPARTMENT_ID = 'department_id',
  DIRECT_MANAGER_USER_ID = 'direct_manager_user_id',
  MANAGER_USER_ID = 'manager_user_id',
  PARENT_ID = 'parent_id',
  NEW_PARENT_ID = 'new_parent_id',
  IS_PRIMARY = 'is_primary',
  CAN_MANAGE = 'can_manage',

  // Sample Record & Export
  AMOUNT = 'amount',
  ASSIGNEE_ID = 'assignee_id',

  // Plugin Manager (Sprint 03)
  PLUGIN_KEY = 'plugin_key',
  NAME_KEY = 'name_key',
  VERSION = 'version',
  TARGET_VERSION = 'target_version',
  LOCKED = 'locked',
  SNAPSHOT = 'snapshot',
  CONFIRM_KEEP_DATA = 'confirm_keep_data',
  SOURCE = 'source',
  IMAGE_REF = 'image_ref',
  REGISTRY_HOST = 'registry_host',
  REPOSITORY = 'repository',
  TAG = 'tag',
  ARTIFACT_REF = 'artifact_ref',
  CHECKSUM = 'checksum',
  USERNAME = 'username',
  SECRET = 'secret',
  UNREAD_ONLY = 'unread_only',
  ENTITLEMENT_PLANS = 'entitlement_plans',
  DEFAULT_INSTALL = 'default_install',
  FORCE_UNINSTALL = 'force_uninstall',
  CONFIRM_TEXT = 'confirm_text',
  AFFECTED_TENANTS = 'affected_tenants',
  DIGEST = 'digest',
  CREDENTIAL_ID = 'credential_id'
}
