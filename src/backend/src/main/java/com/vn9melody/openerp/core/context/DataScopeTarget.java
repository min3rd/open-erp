package com.vn9melody.openerp.core.context;

import java.util.UUID;

/**
 * Minimal scope columns of a secured row (SOL-02 section 4). Plugins implement
 * the same 5-column contract: {@code tenant_id, branch_id, department_id,
 * created_by, assignee_id}.
 */
public record DataScopeTarget(
    UUID branchId,
    UUID departmentId,
    UUID createdBy,
    UUID assigneeId
) {
}
