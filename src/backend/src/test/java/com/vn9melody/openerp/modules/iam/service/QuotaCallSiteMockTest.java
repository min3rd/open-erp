package com.vn9melody.openerp.modules.iam.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.vn9melody.openerp.modules.core.service.TenantQuotaService;
import com.vn9melody.openerp.modules.iam.dto.BusinessRegisterRequest;
import com.vn9melody.openerp.modules.iam.dto.response.BusinessRegisterResponse;
import com.vn9melody.openerp.support.S2IamFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

/**
 * BUG-53 call-site verification: the real registration flow invokes the shared
 * quota entry point. {@code TenantQuotaService} is mocked here to observe the call;
 * the boundary behavior itself is covered by {@link QuotaCallSiteTest} on real
 * PostgreSQL + Redis.
 */
@QuarkusTest
public class QuotaCallSiteMockTest {

    @Inject
    AuthService authService;

    @Test
    @DisplayName("BUG-53: registerBusiness gọi enforceUserQuota trước khi tạo user đầu tiên")
    public void testRegisterBusinessInvokesQuotaCheck() {
        TenantQuotaService quotaMock = Mockito.mock(TenantQuotaService.class);
        QuarkusMock.installMockForType(quotaMock, TenantQuotaService.class);

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        BusinessRegisterRequest request = new BusinessRegisterRequest();
        BusinessRegisterRequest.AdminInfo admin = new BusinessRegisterRequest.AdminInfo();
        admin.fullName = "S2IAM Quota Admin";
        admin.email = "s2iam.quota." + suffix + "@example.com";
        admin.password = "S2IamP@ssw0rd123";
        request.admin = admin;

        BusinessRegisterRequest.TenantInfo tenant = new BusinessRegisterRequest.TenantInfo();
        tenant.name = "S2IAM Quota " + suffix;
        tenant.slug = "s2iam-quota-" + suffix;
        request.tenant = tenant;

        try {
            BusinessRegisterResponse response = QuarkusTransaction.requiringNew()
                .call(() -> authService.registerBusiness(request));

            ArgumentCaptor<UUID> tenantCaptor = ArgumentCaptor.forClass(UUID.class);
            Mockito.verify(quotaMock).checkUserQuota(tenantCaptor.capture());
            assertEquals(response.tenantId, tenantCaptor.getValue().toString());
        } finally {
            QuarkusTransaction.requiringNew().run(S2IamFixtures::cleanup);
        }
    }
}
