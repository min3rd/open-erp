-- Sprint 07 / TASK-428: Core read model for organization + employee scope.
-- Legacy organization tables are kept until the big-bang cutover completes.

CREATE TABLE IF NOT EXISTS core_user_scope (
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    primary_branch_id UUID,
    primary_department_id UUID,
    member_branch_ids UUID[] NOT NULL DEFAULT '{}',
    managed_branch_ids UUID[] NOT NULL DEFAULT '{}',
    department_ids UUID[] NOT NULL DEFAULT '{}',
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_core_user_scope_primary_department
    ON core_user_scope (tenant_id, primary_department_id);

CREATE TABLE IF NOT EXISTS core_user_manager_edge (
    tenant_id UUID NOT NULL,
    manager_user_id UUID NOT NULL,
    subordinate_user_id UUID NOT NULL,
    source VARCHAR(16) NOT NULL DEFAULT 'ORG',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, manager_user_id, subordinate_user_id)
);

CREATE INDEX IF NOT EXISTS idx_core_user_manager_edge_subordinate
    ON core_user_manager_edge (tenant_id, subordinate_user_id);

CREATE TABLE IF NOT EXISTS core_department_closure (
    tenant_id UUID NOT NULL,
    ancestor_id UUID NOT NULL,
    descendant_id UUID NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, ancestor_id, descendant_id)
);

CREATE INDEX IF NOT EXISTS idx_core_department_closure_descendant
    ON core_department_closure (tenant_id, descendant_id);
