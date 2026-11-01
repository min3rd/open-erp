package com.vn9melody.openerp.plugins.employee.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class EmployeeGovernanceClientTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void parsesCoreGovernancePayload() throws Exception {
        var payload = mapper.readTree("""
            {"success":true,"data":{
              "last_owner":true,"last_admin":false,"platform_role":true,
              "owner_count":1,"admin_count":3,"platform_roles":["SUPER_ADMIN"]
            }}
            """);

        EmployeeGovernanceClient.Decision decision = EmployeeGovernanceClient.parse(payload);

        Assertions.assertTrue(decision.lastOwner());
        Assertions.assertFalse(decision.lastAdmin());
        Assertions.assertTrue(decision.platformRole());
        Assertions.assertEquals(1, decision.ownerCount());
        Assertions.assertEquals(3, decision.adminCount());
        Assertions.assertEquals(List.of("SUPER_ADMIN"), decision.platformRoles());
    }

    @Test
    void rejectsMissingData() throws Exception {
        var payload = mapper.readTree("{\"success\":false}");

        ApiException error = Assertions.assertThrows(ApiException.class,
            () -> EmployeeGovernanceClient.parse(payload));

        Assertions.assertEquals("EMPLOYEE_GOVERNANCE_CHECK_UNAVAILABLE", error.getErrorCode());
    }
}
