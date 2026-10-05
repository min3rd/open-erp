-- BUG: role_data_policies declared UNIQUE(role_id, resource) while the table is
-- per-tenant (tenant_id NOT NULL) and global system roles (roles.tenant_id IS NULL)
-- share one role_id across every tenant. Only the first tenant to save a policy
-- could persist it; every other tenant's upsert hit "duplicate key value violates
-- unique constraint uq_role_resource_policy" (500) and stayed at scope NONE, which
-- made every data operation return IAM_PERMISSION_DENIED_DATA_SCOPE.
-- Scope the uniqueness to the owning tenant, matching the table's tenant_id column.
ALTER TABLE role_data_policies DROP CONSTRAINT IF EXISTS uq_role_resource_policy;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_role_resource_policy'
          AND conrelid = 'role_data_policies'::regclass
    ) THEN
        ALTER TABLE role_data_policies
            ADD CONSTRAINT uq_role_resource_policy UNIQUE (tenant_id, role_id, resource);
    END IF;
END $$;
