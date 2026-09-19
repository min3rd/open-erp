package com.vn9melody.openerp.core.enums;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.vn9melody.openerp.modules.platform.api.PlatformResponseKey;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Guards the compile-time JSON name constants used in DTO {@code @JsonProperty}
 * annotations against drift from their enum counterparts
 * (AGENTS.md: zero hardcoded payload keys).
 */
public class ResponseKeyParityTest {

    @Test
    @DisplayName("ResponseKey.Json constants khớp 1-1 với enum ResponseKey")
    public void testResponseKeyParity() {
        assertParity(ResponseKey.class, ResponseKey.Json.class);
    }

    @Test
    @DisplayName("PlatformResponseKey.Json constants khớp 1-1 với enum PlatformResponseKey")
    public void testPlatformResponseKeyParity() {
        assertParity(PlatformResponseKey.class, PlatformResponseKey.Json.class);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void assertParity(Class<? extends Enum> enumClass, Class<?> jsonConstants) {
        try {
            Method getKey = enumClass.getMethod("getKey");
            for (Field field : jsonConstants.getFields()) {
                String literal = (String) field.get(null);
                Enum constant = Enum.valueOf(enumClass, field.getName());
                assertEquals(literal, getKey.invoke(constant),
                    "Json constant " + field.getName() + " diverges from " + enumClass.getSimpleName());
            }
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(e);
        }
    }
}
