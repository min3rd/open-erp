package com.vn9melody.openerp.plugins.organization.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrganizationValidationTest {

    @Test
    void normalizesCodeAndStatus() {
        assertEquals("HQ", OrganizationValidation.code(" HQ ", "code"));
        assertEquals("ACTIVE", OrganizationValidation.status(null));
        assertEquals("INACTIVE", OrganizationValidation.status("inactive"));
    }

    @Test
    void rejectsInvalidCodeAndRange() {
        assertThrows(ApiException.class, () -> OrganizationValidation.code("has space", "code"));
        assertThrows(ApiException.class,
            () -> OrganizationValidation.dateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1)));
    }
}
