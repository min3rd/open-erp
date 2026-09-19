package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.enums.DataOperation;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declares the functional permission ({@code domain:resource:action}) required
 * to invoke a JAX-RS endpoint and the data operation used by the data scope
 * engine (SOL-02 section 6b, TASK-267).
 *
 * <p>Endpoints without this annotation are default-allow at this layer so the
 * existing Sprint 01 APIs keep their current behavior.</p>
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface RequirePermission {

    /** Functional permission code, e.g. {@code core:sample-record:read}. */
    String value();

    /** Data operation enforced by the data scope engine for this endpoint. */
    DataOperation operation() default DataOperation.READ;
}
