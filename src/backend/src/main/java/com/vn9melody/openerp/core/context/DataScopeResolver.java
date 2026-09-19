package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Resolves the effective {@link DataScope} of a (resource, operation) pair for
 * the current user by unioning every role policy with the "most permissive"
 * rule of ANL-02 (SOL-02 section 4, TASK-289).
 *
 * <p>When no role defines an explicit policy: tenant owners fall back to
 * {@code ALL} (TENANT_OWNER role contract) and every other user falls back to
 * {@code NONE} (deny by default).</p>
 */
@ApplicationScoped
public class DataScopeResolver {

    public DataScope resolve(UserSecurityContext context, String resource, DataOperation operation) {
        if (context == null || resource == null || operation == null) {
            return DataScope.NONE;
        }
        DataScope explicit = context.explicitScopeFor(resource, operation);
        if (explicit != null) {
            return explicit;
        }
        return context.isTenantOwner() ? DataScope.ALL : DataScope.NONE;
    }

    public DataScope mostPermissive(DataScope left, DataScope right) {
        DataScope safeLeft = left != null ? left : DataScope.NONE;
        DataScope safeRight = right != null ? right : DataScope.NONE;
        return safeLeft.mostPermissive(safeRight);
    }
}
