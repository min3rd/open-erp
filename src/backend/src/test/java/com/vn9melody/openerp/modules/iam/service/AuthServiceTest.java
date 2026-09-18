package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.CompanySize;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.BruteForceService;
import com.vn9melody.openerp.modules.iam.dto.*;
import com.vn9melody.openerp.modules.iam.dto.response.*;
import com.vn9melody.openerp.modules.iam.model.*;

@QuarkusTest
public class AuthServiceTest {

    @Inject
    AuthService authService;

    @Inject
    BruteForceService bruteForceService;

    @BeforeEach
    @Transactional
    public void setup() {
        PasswordResetToken.deleteAll();
        UserTwoFactor.deleteAll();
        UserProfile.deleteAll();
        UserCredential.deleteAll();
        UserTenant.deleteAll();
        User.deleteAll();
        Tenant.deleteAll();
    }

    @Test
    @DisplayName("TC-01: Đăng ký cá nhân thành công & xác thực email cấp Personal Workspace")
    public void testPersonalRegistrationAndEmailVerification() {
        PersonalRegisterRequest req = new PersonalRegisterRequest();
        req.email = "test.user@example.com";
        req.password = "P@ssw0rd123";
        req.fullName = "Nguyễn Văn A";
        req.phone = "0901234567";

        PersonalRegisterResponse result = authService.registerPersonal(req);
        Assertions.assertNotNull(result.userId);
        Assertions.assertEquals(AccountStatus.PENDING_VERIFICATION, result.status);

        User user = User.findByEmail("test.user@example.com");
        Assertions.assertNotNull(user);
        Assertions.assertNotNull(user.verificationOtp);

        // Verify email sai OTP
        VerifyEmailRequest failVerify = new VerifyEmailRequest();
        failVerify.email = req.email;
        failVerify.otpCode = "000000";
        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.verifyEmail(failVerify));
        Assertions.assertEquals(ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED, ex.getErrorCode());

        // Verify email đúng OTP
        VerifyEmailRequest successVerify = new VerifyEmailRequest();
        successVerify.email = req.email;
        successVerify.otpCode = user.verificationOtp;
        VerifyEmailResponse verifyResult = authService.verifyEmail(successVerify);
        Assertions.assertEquals(AccountStatus.ACTIVE, verifyResult.status);
        Assertions.assertNotNull(verifyResult.personalTenantId);

        // Kiểm tra UserTenant cá nhân đã được tạo
        User.getEntityManager().clear();
        User updatedUser = User.findByEmail(req.email);
        Assertions.assertEquals(AccountStatus.ACTIVE, updatedUser.status);
        Assertions.assertNotNull(updatedUser.emailVerifiedAt);
    }

    @Test
    @DisplayName("TC-02: Đăng ký cá nhân trùng email phải báo lỗi AUTH_EMAIL_ALREADY_EXISTS")
    public void testPersonalRegistrationDuplicateEmail() {
        PersonalRegisterRequest req = new PersonalRegisterRequest();
        req.email = "duplicate@example.com";
        req.password = "P@ssw0rd123";
        req.fullName = "Nguyễn Văn B";
        authService.registerPersonal(req);

        // Đăng ký lại cùng email
        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.registerPersonal(req));
        Assertions.assertEquals(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, ex.getErrorCode());
        Assertions.assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("TC-03: Đăng ký doanh nghiệp thành công và tạo Organization Tenant")
    public void testBusinessRegistration() {
        BusinessRegisterRequest req = new BusinessRegisterRequest();
        req.tenant = new BusinessRegisterRequest.TenantInfo();
        req.tenant.name = "Công ty TNHH Giải Pháp Mới";
        req.tenant.slug = "giai-phap-moi";
        req.tenant.taxCode = "0109999999";
        req.tenant.companySize = CompanySize.SMALL;

        req.admin = new BusinessRegisterRequest.AdminInfo();
        req.admin.fullName = "Trần Doanh Nghiệp";
        req.admin.email = "admin@giaiphapmoi.vn";
        req.admin.password = "AdminP@ss123";

        BusinessRegisterResponse result = authService.registerBusiness(req);
        Assertions.assertNotNull(result.tenantId);
        Assertions.assertEquals("giai-phap-moi", result.tenantSlug);
        Assertions.assertEquals(UserRole.TENANT_ADMIN, result.role);

        // Trùng slug phải báo lỗi
        BusinessRegisterRequest duplicateReq = new BusinessRegisterRequest();
        duplicateReq.tenant = new BusinessRegisterRequest.TenantInfo();
        duplicateReq.tenant.name = "Công ty Khác";
        duplicateReq.tenant.slug = "giai-phap-moi"; // Trùng slug
        duplicateReq.admin = new BusinessRegisterRequest.AdminInfo();
        duplicateReq.admin.email = "admin2@khac.vn";
        duplicateReq.admin.password = "Password123";
        duplicateReq.admin.fullName = "Admin 2";

        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.registerBusiness(duplicateReq));
        Assertions.assertEquals(ErrorCode.AUTH_TENANT_SLUG_DUPLICATE, ex.getErrorCode());
        Assertions.assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("TC-04: Đăng nhập thành công và phòng chống Brute-force")
    public void testLoginAndBruteForceProtection() {
        // Tạo tài khoản active
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "login.test@example.com";
        reg.password = "Secret123!";
        reg.fullName = "Lê Đăng Nhập";
        authService.registerPersonal(reg);

        User user = User.findByEmail(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = user.verificationOtp;
        authService.verifyEmail(ver);

        // 1. Thử sai 5 lần liên tiếp
        LoginRequest wrongReq = new LoginRequest();
        wrongReq.email = reg.email;
        wrongReq.password = "WrongPassword";

        for (int i = 0; i < 5; i++) {
            ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.login(wrongReq, "Chrome", "127.0.0.1"));
            Assertions.assertEquals(ErrorCode.AUTH_INVALID_CREDENTIALS, ex.getErrorCode());
        }

        // 2. Lần thứ 6 phải bị khóa tài khoản (423 AUTH_ACCOUNT_LOCKED)
        ApiException lockedEx = Assertions.assertThrows(ApiException.class, () -> authService.login(wrongReq, "Chrome", "127.0.0.1"));
        Assertions.assertEquals(ErrorCode.AUTH_ACCOUNT_LOCKED, lockedEx.getErrorCode());
        Assertions.assertEquals(423, lockedEx.getHttpStatus());

        // Reset brute-force thủ công để test tiếp đăng nhập đúng
        bruteForceService.resetAttempts(reg.email);

        // 3. Đăng nhập đúng thông tin -> Cấp Token
        LoginRequest correctReq = new LoginRequest();
        correctReq.email = reg.email;
        correctReq.password = "Secret123!";
        AuthResponse loginResult = authService.login(correctReq, "Chrome Mac", "127.0.0.1");

        Assertions.assertNotNull(loginResult.accessToken);
        Assertions.assertNotNull(loginResult.refreshToken);
        Assertions.assertNotNull(loginResult.sessionId);
    }

    @Test
    @DisplayName("TC-05: Quên mật khẩu & Đặt lại mật khẩu mới")
    public void testForgotPasswordAndReset() {
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "forgot.pass@example.com";
        reg.password = "OldPassword123";
        reg.fullName = "Phan Quên Mật Khẩu";
        authService.registerPersonal(reg);

        User user = User.findByEmail(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = user.verificationOtp;
        authService.verifyEmail(ver);

        // Yêu cầu quên mật khẩu
        authService.forgotPassword(reg.email);

        PasswordResetToken prt = PasswordResetToken.find("user", user).firstResult();
        Assertions.assertNotNull(prt);
        String token = prt.tokenHash;

        // Đặt lại mật khẩu mới
        authService.resetPassword(token, "NewPassword999!");

        // Đăng nhập lại với mật khẩu mới
        LoginRequest loginReq = new LoginRequest();
        loginReq.email = reg.email;
        loginReq.password = "NewPassword999!";
        AuthResponse loginRes = authService.login(loginReq, "Firefox", "127.0.0.1");
        Assertions.assertNotNull(loginRes.accessToken);
    }
}
