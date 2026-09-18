package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.dto.ChangePasswordRequest;
import com.vn9melody.openerp.modules.iam.dto.PersonalRegisterRequest;
import com.vn9melody.openerp.modules.iam.dto.ProfileUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.VerifyEmailRequest;
import com.vn9melody.openerp.modules.iam.dto.response.UserProfileResponse;
import com.vn9melody.openerp.modules.iam.dto.response.UserSessionResponse;
import com.vn9melody.openerp.modules.iam.model.*;
import com.vn9melody.openerp.support.RedisTestSupport;

@QuarkusTest
public class AccountServiceTest {

    @Inject
    AccountService accountService;

    @Inject
    AuthService authService;

    @Inject
    SessionManager sessionManager;

    @Inject
    RedisDataSource redis;

    @InjectMock
    EmailNotificationService emailNotificationService;

    private User activeUser;

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
        RedisTestSupport.clearAll(redis);

        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "account.test@example.com";
        reg.password = "InitialPassword123!";
        reg.fullName = "Đặng Quản Lý";
        reg.phone = "0988776655";
        authService.registerPersonal(reg);

        activeUser = User.findByEmail(reg.email);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(emailNotificationService).sendVerificationOtp(ArgumentMatchers.eq(reg.email), otpCaptor.capture());

        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = otpCaptor.getValue();
        authService.verifyEmail(ver);
    }

    @Test
    @DisplayName("TC-11: Lấy thông tin hồ sơ và cập nhật thông tin hồ sơ cá nhân")
    public void testGetAndUpdateProfile() {
        UserProfileResponse profile = accountService.getProfile(activeUser.id);
        Assertions.assertEquals("account.test@example.com", profile.email);
        Assertions.assertEquals("Đặng Quản Lý", profile.fullName);
        Assertions.assertEquals("0988776655", profile.phone);

        ProfileUpdateRequest updateReq = new ProfileUpdateRequest();
        updateReq.fullName = "Đặng Quản Lý (Cập Nhật)";
        updateReq.phone = "0911223344";
        updateReq.avatarUrl = "https://cdn.example.com/avatar.png";
        updateReq.language = "en";
        updateReq.timezone = "UTC";

        UserProfileResponse updated = accountService.updateProfile(activeUser.id, updateReq);
        Assertions.assertEquals("Đặng Quản Lý (Cập Nhật)", updated.fullName);
        Assertions.assertEquals("0911223344", updated.phone);
        Assertions.assertEquals("en", updated.language);
        Assertions.assertEquals("UTC", updated.timezone);
    }

    @Test
    @DisplayName("TC-12: Đổi mật khẩu đúng & sai mật khẩu cũ")
    public void testChangePassword() {
        ChangePasswordRequest wrongReq = new ChangePasswordRequest();
        wrongReq.currentPassword = "SaiPassword";
        wrongReq.newPassword = "NewSecretPassword456!";
        ApiException ex = Assertions.assertThrows(ApiException.class, () -> accountService.changePassword(activeUser.id, wrongReq, "session-1"));
        Assertions.assertEquals(ErrorCode.ACCOUNT_OLD_PASSWORD_INCORRECT, ex.getErrorCode());

        ChangePasswordRequest correctReq = new ChangePasswordRequest();
        correctReq.currentPassword = "InitialPassword123!";
        correctReq.newPassword = "NewSecretPassword456!";
        correctReq.logoutOtherDevices = true;
        Assertions.assertDoesNotThrow(() -> accountService.changePassword(activeUser.id, correctReq, "session-1"));
    }

    @Test
    @DisplayName("TC-13: Quản lý phiên đăng nhập trên Redis và thu hồi phiên")
    public void testSessionManagement() {
        String sessionId = sessionManager.createSession(activeUser.id, "Chrome", "203.0.113.10");
        Assertions.assertTrue(sessionManager.isSessionActive(activeUser.id, sessionId));

        List<UserSessionResponse> sessions = accountService.getSessions(activeUser.id, sessionId);
        Assertions.assertEquals(1, sessions.size());
        Assertions.assertEquals("203.0.113.10", sessions.get(0).ipAddress);
        Assertions.assertEquals(true, sessions.get(0).isCurrent);

        accountService.revokeSession(activeUser.id, sessionId);
        Assertions.assertFalse(sessionManager.isSessionActive(activeUser.id, sessionId));
        Assertions.assertEquals(0, accountService.getSessions(activeUser.id, null).size());
    }
}
