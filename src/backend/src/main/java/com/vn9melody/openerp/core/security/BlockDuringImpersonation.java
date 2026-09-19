package com.vn9melody.openerp.core.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks endpoints that must never be reachable from an impersonation ("login-as")
 * session (BR-SA-04 / BUG-68). When the caller token carries {@code act_sub},
 * {@code impersonation_id} or {@code is_impersonation = true}, the
 * {@link PermissionEnforcementFilter} rejects the request with
 * {@code 403 SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN}.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface BlockDuringImpersonation {
}
