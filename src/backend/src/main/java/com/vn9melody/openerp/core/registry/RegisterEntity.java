package com.vn9melody.openerp.core.registry;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface RegisterEntity {

    String entityName();

    String pluginId() default "core-iam";

    String storage() default "postgres";

    String table();

    String[] publicFields() default {};

    String[] relations() default {};
}
