package com.vn9melody.openerp.plugins.employee.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApprovalChainTest {

    private static final UUID BRANCH = UUID.randomUUID();
    private static final UUID DEPARTMENT = UUID.randomUUID();

    @Test
    void fallsBackToSingleRoleStepWithoutConfig() {
        List<ApprovalChain.Step> steps = ApprovalChain.resolve(List.of(), Set.of("CONTACT"),
            BRANCH, DEPARTMENT);
        assertEquals(1, steps.size());
        assertEquals(1, steps.get(0).stepNo());
        assertEquals("ROLE", steps.get(0).approverType());
    }

    @Test
    void tenantChainIsOrderedAndRenumbered() {
        UUID approver = UUID.randomUUID();
        List<ApprovalChain.ConfigRow> config = List.of(
            new ApprovalChain.ConfigRow("TENANT", null, "CONTACT", 5, "USER", approver),
            new ApprovalChain.ConfigRow("TENANT", null, "CONTACT", 2, "ROLE", null));
        List<ApprovalChain.Step> steps = ApprovalChain.resolve(config, Set.of("CONTACT"),
            BRANCH, DEPARTMENT);
        assertEquals(2, steps.size());
        assertEquals(1, steps.get(0).stepNo());
        assertEquals("ROLE", steps.get(0).approverType());
        assertEquals(2, steps.get(1).stepNo());
        assertEquals("USER", steps.get(1).approverType());
        assertEquals(approver, steps.get(1).approverId());
    }

    @Test
    void departmentScopeWinsOverTenantForSameStep() {
        UUID manager = UUID.randomUUID();
        List<ApprovalChain.ConfigRow> config = List.of(
            new ApprovalChain.ConfigRow("TENANT", null, "PERSONAL", 1, "ROLE", null),
            new ApprovalChain.ConfigRow("DEPARTMENT", DEPARTMENT, "PERSONAL", 1, "USER", manager));
        List<ApprovalChain.Step> steps = ApprovalChain.resolve(config, Set.of("PERSONAL"),
            BRANCH, DEPARTMENT);
        assertEquals(1, steps.size());
        assertEquals("USER", steps.get(0).approverType());
        assertEquals(manager, steps.get(0).approverId());
    }

    @Test
    void nonMatchingBranchOrGroupIsIgnored() {
        List<ApprovalChain.ConfigRow> config = List.of(
            new ApprovalChain.ConfigRow("BRANCH", UUID.randomUUID(), "CONTACT", 1, "ROLE", null),
            new ApprovalChain.ConfigRow("TENANT", null, "EDUCATION", 1, "ROLE", null));
        List<ApprovalChain.Step> steps = ApprovalChain.resolve(config, Set.of("CONTACT"),
            BRANCH, DEPARTMENT);
        assertEquals(1, steps.size());
        assertEquals("ROLE", steps.get(0).approverType());
        assertTrue(steps.get(0).approverId() == null);
    }

    @Test
    void allAndProfileGroupsMatchEveryField() {
        List<ApprovalChain.ConfigRow> config = List.of(
            new ApprovalChain.ConfigRow("TENANT", null, "ALL", 1, "MANAGER", null));
        assertEquals(1, ApprovalChain.resolve(config, Set.of("LEGAL"), BRANCH, DEPARTMENT).size());
        List<ApprovalChain.ConfigRow> profile = List.of(
            new ApprovalChain.ConfigRow("TENANT", null, "PROFILE", 1, "ROLE", null));
        assertEquals(1, ApprovalChain.resolve(profile, Set.of("EDUCATION"), BRANCH, DEPARTMENT).size());
    }
}
