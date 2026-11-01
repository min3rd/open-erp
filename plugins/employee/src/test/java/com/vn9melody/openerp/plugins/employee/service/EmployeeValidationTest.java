package com.vn9melody.openerp.plugins.employee.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmployeeValidationTest {

    @Test
    void normalizesCodeAndDefaults() {
        assertEquals("EMP-001", EmployeeValidation.employeeCode(" emp-001 "));
        assertEquals("DRAFT", EmployeeValidation.status(null));
        assertEquals("EMPLOYEE", EmployeeValidation.employeeType(null));
        assertEquals("ACTIVE", EmployeeValidation.assignmentStatus(null));
    }

    @Test
    void rejectsInvalidCodeAndDateRange() {
        assertThrows(ApiException.class, () -> EmployeeValidation.employeeCode("has space"));
        assertThrows(ApiException.class,
            () -> EmployeeValidation.dateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1)));
    }

    @Test
    void selfFieldsAreAllowlistedAndSystemFieldsRejected() {
        Map<String, Object> accepted = Map.of("phone", "0900000000");
        assertEquals(accepted, EmployeeValidation.selfFields(accepted));
        assertThrows(ApiException.class,
            () -> EmployeeValidation.selfFields(Map.of("employee_id", "00000000-0000-0000-0000-000000000000")));
    }

    @Test
    void changeFieldsRejectIdentityColumns() {
        assertTrue(EmployeeValidation.changeFields(Map.of("phone", "0900000000")).containsKey("phone"));
        assertThrows(ApiException.class,
            () -> EmployeeValidation.changeFields(Map.of("employee_code", "EMP-002")));
    }

    @Test
    void defaultFieldCatalogCoversSelfService() {
        assertEquals(15, EmployeeFields.values().length);
        assertTrue(EmployeeFields.fromKey("phone").editableByDefault());
        assertTrue(EmployeeFields.fromKey("personal_email").requiresApprovalByDefault());
    }

    @Test
    void approvalConfigValidatesScopeApproverAndStep() {
        assertEquals("DEPARTMENT", EmployeeValidation.approvalScopeType("department"));
        assertEquals("USER", EmployeeValidation.approverType("user"));
        assertEquals("CONTACT", EmployeeValidation.fieldGroup("contact"));
        assertEquals(3, EmployeeValidation.approvalStep(3));
        assertThrows(ApiException.class, () -> EmployeeValidation.approvalScopeType("TEAM"));
        assertThrows(ApiException.class, () -> EmployeeValidation.approverType("GROUP"));
        assertThrows(ApiException.class, () -> EmployeeValidation.approvalStep(0));
    }

    @Test
    void changedFieldsResolveToGroups() {
        assertTrue(EmployeeValidation.fieldGroups(Set.of("phone")).contains("CONTACT"));
        assertTrue(EmployeeValidation.fieldGroups(Set.of("school")).contains("EDUCATION"));
        assertTrue(EmployeeValidation.fieldGroups(Set.of("national_id")).contains("LEGAL"));
        assertEquals("GENERAL", EmployeeValidation.fieldGroupOf("notes"));
    }

    @Test
    void onboardingTokenAndEmailAreTrustBoundaryValidated() {
        assertEquals("a@example.com", EmployeeValidation.onboardingEmail(" A@Example.com "));
        assertThrows(ApiException.class, () -> EmployeeValidation.onboardingEmail("not-an-email"));
        String token = "A".repeat(43);
        assertEquals(token, EmployeeValidation.onboardingToken(token));
        assertThrows(ApiException.class, () -> EmployeeValidation.onboardingToken("short"));
        assertThrows(ApiException.class,
            () -> EmployeeValidation.onboardingToken("bad token with spaces and length"));
    }

    @Test
    void onboardingFieldsRejectIdentityColumns() {
        assertTrue(EmployeeValidation.onboardingFields(Map.of("phone", "0900000000"))
            .containsKey("phone"));
        assertThrows(ApiException.class,
            () -> EmployeeValidation.onboardingFields(Map.of("employee_code", "EMP-002")));
    }

    @Test
    void privacyCampaignAndScanFiltersAreNormalized() {
        assertEquals("ACCESS", EmployeeValidation.privacyRequestType("access"));
        assertNull(EmployeeValidation.privacyStatusFilter(null));
        assertEquals("GRANTED", EmployeeValidation.consentStatus("granted"));
        assertEquals("ACTIVE", EmployeeValidation.campaignFilterStatus("active"));
        assertEquals("CLEAN", EmployeeValidation.scanStatus("clean"));
        assertThrows(ApiException.class, () -> EmployeeValidation.scanStatus("PENDING"));
    }
}
