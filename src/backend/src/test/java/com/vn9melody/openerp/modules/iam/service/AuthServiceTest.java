package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.CompanySize;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.BruteForceService;
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.dto.*;
import com.vn9melody.openerp.modules.iam.dto.response.*;
import com.vn9melody.openerp.modules.iam.model.*;
import com.vn9melody.openerp.support.RedisTestSupport;
import com.vn9melody.openerp.support.TestDbCleanup;

@QuarkusTest
public class AuthServiceTest {

    @Inject
    AuthService authService;

    @Inject
    BruteForceService bruteForceService;

    @Inject
    TotpService totpService;

    @Inject
    com.vn9melody.openerp.core.security.JwtTokenService jwtTokenService;

    @Inject
    RedisDataSource redis;

    @Inject
    EntityManager entityManager;

    @InjectMock
    EmailNotificationService emailNotificationService;

    @BeforeEach
    @Transactional
    public void setup() {
        TestDbCleanup.cleanup(entityManager);
        RedisTestSupport.clearAll(redis);
    }

    private String captureOtp(String email) {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(emailNotificationService).sendVerificationOtp(ArgumentMatchers.eq(email), otpCaptor.capture());
        return otpCaptor.getValue();
    }

    private void clearPersistentLock(String email) {
        QuarkusTransaction.requiringNew().run(() -> {
            User user = User.findByEmail(email);
            if (user == null) {
                return;
            }
            UserCredential credential = UserCredential.findByUserId(user.id);
            if (credential != null) {
                credential.failedLoginCount = 0;
                credential.lockedUntil = null;
                credential.persist();
            }
        });
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
        Assertions.assertEquals(AccountStatus.PENDING_VERIFICATION, user.status);

        String otp = captureOtp(req.email);

        VerifyEmailRequest failVerify = new VerifyEmailRequest();
        failVerify.email = req.email;
        failVerify.otpCode = "000000";
        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.verifyEmail(failVerify));
        Assertions.assertEquals(ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED, ex.getErrorCode());

        VerifyEmailRequest successVerify = new VerifyEmailRequest();
        successVerify.email = req.email;
        successVerify.otpCode = otp;
        VerifyEmailResponse verifyResult = authService.verifyEmail(successVerify);
        Assertions.assertEquals(AccountStatus.ACTIVE, verifyResult.status);
        Assertions.assertNotNull(verifyResult.personalTenantId);

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

        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.registerPersonal(req));
        Assertions.assertEquals(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, ex.getErrorCode());
        Assertions.assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("TC-03: Đăng ký doanh nghiệp thành công, gửi email chào mừng và tạo Organization Tenant")
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

        Mockito.verify(emailNotificationService).sendBusinessWelcomeEmail(
            ArgumentMatchers.eq("admin@giaiphapmoi.vn"),
            ArgumentMatchers.eq("Công ty TNHH Giải Pháp Mới"),
            ArgumentMatchers.eq("giai-phap-moi"));

        BusinessRegisterRequest duplicateReq = new BusinessRegisterRequest();
        duplicateReq.tenant = new BusinessRegisterRequest.TenantInfo();
        duplicateReq.tenant.name = "Công ty Khác";
        duplicateReq.tenant.slug = "giai-phap-moi";
        duplicateReq.admin = new BusinessRegisterRequest.AdminInfo();
        duplicateReq.admin.email = "admin2@khac.vn";
        duplicateReq.admin.password = "Password123";
        duplicateReq.admin.fullName = "Admin 2";

        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.registerBusiness(duplicateReq));
        Assertions.assertEquals(ErrorCode.AUTH_TENANT_SLUG_DUPLICATE, ex.getErrorCode());
        Assertions.assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("TC-04: Đăng nhập thành công và phòng chống Brute-force (cửa sổ 10 phút)")
    public void testLoginAndBruteForceProtection() {
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "login.test@example.com";
        reg.password = "Secret123!";
        reg.fullName = "Lê Đăng Nhập";
        authService.registerPersonal(reg);

        String otp = captureOtp(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = otp;
        authService.verifyEmail(ver);

        LoginRequest wrongReq = new LoginRequest();
        wrongReq.email = reg.email;
        wrongReq.password = "WrongPassword";

        for (int i = 0; i < 5; i++) {
            ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.login(wrongReq, "Chrome", "127.0.0.1"));
            Assertions.assertEquals(ErrorCode.AUTH_INVALID_CREDENTIALS, ex.getErrorCode());
        }

        ApiException lockedEx = Assertions.assertThrows(ApiException.class, () -> authService.login(wrongReq, "Chrome", "127.0.0.1"));
        Assertions.assertEquals(ErrorCode.AUTH_ACCOUNT_LOCKED, lockedEx.getErrorCode());
        Assertions.assertEquals(423, lockedEx.getHttpStatus());

        User user = User.findByEmail(reg.email);
        Assertions.assertTrue(bruteForceService.isLocked(reg.email));
        Assertions.assertEquals(5, user.id != null ? UserCredential.findByUserId(user.id).failedLoginCount : 0);
        Assertions.assertNotNull(UserCredential.findByUserId(user.id).lockedUntil);

        bruteForceService.resetAttempts(reg.email);
        clearPersistentLock(reg.email);

        LoginRequest correctReq = new LoginRequest();
        correctReq.email = reg.email;
        correctReq.password = "Secret123!";
        AuthResponse loginResult = authService.login(correctReq, "Chrome Mac", "127.0.0.1");

        Assertions.assertNotNull(loginResult.accessToken);
        Assertions.assertNotNull(loginResult.refreshToken);
        Assertions.assertNotNull(loginResult.sessionId);

        UserCredential.getEntityManager().clear();
        Assertions.assertEquals(0, UserCredential.findByUserId(user.id).failedLoginCount);
        Assertions.assertNull(UserCredential.findByUserId(user.id).lockedUntil);
    }

    @Test
    @DisplayName("BUG-44: Hết hạn khóa brute-force (TTL Redis) thì tài khoản đăng nhập lại được")
    public void testBruteForceLockExpiryAllowsLoginAgain() throws InterruptedException {
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "lock.expiry@example.com";
        reg.password = "LockExpiry123!";
        reg.fullName = "Nguyễn Hết Khóa";
        authService.registerPersonal(reg);

        String otp = captureOtp(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = otp;
        authService.verifyEmail(ver);

        for (int i = 0; i < 5; i++) {
            bruteForceService.recordFailedAttempt(reg.email);
        }
        Assertions.assertTrue(bruteForceService.isLocked(reg.email));

        LoginRequest correctReq = new LoginRequest();
        correctReq.email = reg.email;
        correctReq.password = "LockExpiry123!";

        ApiException lockedEx = Assertions.assertThrows(ApiException.class,
            () -> authService.login(correctReq, "Chrome", "127.0.0.1"));
        Assertions.assertEquals(ErrorCode.AUTH_ACCOUNT_LOCKED, lockedEx.getErrorCode());
        Assertions.assertEquals(423, lockedEx.getHttpStatus());

        // Rút ngắn TTL khóa để mô phỏng hết hạn khóa 15 phút mà không phải chờ thật
        redis.value(String.class).setex("bruteforce:lock:" + reg.email.toLowerCase(), 1, "1");
        Thread.sleep(1200);

        Assertions.assertFalse(bruteForceService.isLocked(reg.email));
        AuthResponse loginResult = authService.login(correctReq, "Chrome", "127.0.0.1");
        Assertions.assertNotNull(loginResult.accessToken);
        Assertions.assertNotNull(loginResult.sessionId);
    }

    @Test
    @DisplayName("TC-05: Quên mật khẩu (lưu hash SHA-256) & Đặt lại mật khẩu mới")
    public void testForgotPasswordAndReset() {
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "forgot.pass@example.com";
        reg.password = "OldPassword123";
        reg.fullName = "Phan Quên Mật Khẩu";
        authService.registerPersonal(reg);

        String otp = captureOtp(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = otp;
        authService.verifyEmail(ver);

        User user = User.findByEmail(reg.email);
        authService.forgotPassword(reg.email);

        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(emailNotificationService).sendPasswordResetEmail(ArgumentMatchers.eq(reg.email), tokenCaptor.capture());
        String rawToken = tokenCaptor.getValue();

        PasswordResetToken prt = PasswordResetToken.find("user", user).firstResult();
        Assertions.assertNotNull(prt);
        Assertions.assertNotEquals(rawToken, prt.tokenHash, "Token reset phải được lưu dạng hash, không phải raw");
        Assertions.assertEquals(totpService.sha256Hex(rawToken), prt.tokenHash);

        authService.resetPassword(rawToken, "NewPassword999!");

        LoginRequest loginReq = new LoginRequest();
        loginReq.email = reg.email;
        loginReq.password = "NewPassword999!";
        AuthResponse loginRes = authService.login(loginReq, "Firefox", "127.0.0.1");
        Assertions.assertNotNull(loginRes.accessToken);
    }

    @Test
    @DisplayName("TC-06: Refresh token hợp lệ và bị từ chối sau khi logout")
    public void testRefreshAndLogout() throws Exception {
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "refresh.test@example.com";
        reg.password = "RefreshPass123!";
        reg.fullName = "Nguyễn Làm Mới";
        authService.registerPersonal(reg);

        String otp = captureOtp(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = otp;
        authService.verifyEmail(ver);

        LoginRequest loginReq = new LoginRequest();
        loginReq.email = reg.email;
        loginReq.password = "RefreshPass123!";
        AuthResponse loginRes = authService.login(loginReq, "Chrome", "127.0.0.1");

        RefreshTokenResponse refreshed = authService.refresh(loginRes.refreshToken);
        Assertions.assertNotNull(refreshed.accessToken);
        Assertions.assertEquals(900, refreshed.expiresIn);

        User user = User.findByEmail(reg.email);
        var accessJwt = jwtTokenService.parseToken(loginRes.accessToken);
        authService.logout(user.id, loginRes.sessionId, accessJwt.getTokenID(), 900);

        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.refresh(loginRes.refreshToken));
        Assertions.assertEquals(ErrorCode.AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED, ex.getErrorCode());
        Assertions.assertEquals(401, ex.getHttpStatus());
    }

    @Test
    @DisplayName("TC-07: Resend verification bị giới hạn 60 giây")
    public void testResendVerificationRateLimit() {
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "resend.test@example.com";
        reg.password = "ResendPass123!";
        reg.fullName = "Trần Gửi Lại";
        authService.registerPersonal(reg);

        authService.resendVerification(reg.email);

        ApiException ex = Assertions.assertThrows(ApiException.class, () -> authService.resendVerification(reg.email));
        Assertions.assertEquals(ErrorCode.AUTH_OTP_RESEND_TOO_SOON, ex.getErrorCode());
        Assertions.assertEquals(429, ex.getHttpStatus());
        Assertions.assertTrue(ex.getParams().containsKey("retry_after"));
    }
}
