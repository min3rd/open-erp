package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.iam.dto.ChangePasswordRequest;
import com.vn9melody.openerp.modules.iam.dto.PersonalRegisterRequest;
import com.vn9melody.openerp.modules.iam.dto.ProfileUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.VerifyEmailRequest;
import com.vn9melody.openerp.modules.iam.dto.response.UserProfileResponse;
import com.vn9melody.openerp.modules.iam.dto.response.UserSessionResponse;
import com.vn9melody.openerp.modules.iam.model.*;

@QuarkusTest
public class AccountServiceTest {

    @Inject
    AccountService accountService;

    @Inject
    AuthService authService;

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

        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "account.test@example.com";
        reg.password = "InitialPassword123!";
        reg.fullName = "Đặng Quản Lý";
        reg.phone = "0988776655";
        authService.registerPersonal(reg);

        activeUser = User.findByEmail(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = activeUser.verificationOtp;
        authService.verifyEmail(ver);
    }

    @Test
    @DisplayName("TC-08: Lấy thông tin hồ sơ và cập nhật thông tin hồ sơ cá nhân")
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
    @DisplayName("TC-09: Đổi mật khẩu đúng & sai mật khẩu cũ")
    public void testChangePassword() {
        // Sai mật khẩu cũ
        ChangePasswordRequest wrongReq = new ChangePasswordRequest();
        wrongReq.currentPassword = "SaiPassword";
        wrongReq.newPassword = "NewSecretPassword456!";
        ApiException ex = Assertions.assertThrows(ApiException.class, () -> accountService.changePassword(activeUser.id, wrongReq, "session-1"));
        Assertions.assertEquals(ErrorCode.ACCOUNT_OLD_PASSWORD_INCORRECT, ex.getErrorCode());

        // Đúng mật khẩu cũ
        ChangePasswordRequest correctReq = new ChangePasswordRequest();
        correctReq.currentPassword = "InitialPassword123!";
        correctReq.newPassword = "NewSecretPassword456!";
        correctReq.logoutOtherDevices = true;
        Assertions.assertDoesNotThrow(() -> accountService.changePassword(activeUser.id, correctReq, "session-1"));
    }

    @Test
    @DisplayName("TC-10: Quản lý phiên đăng nhập và thu hồi phiên")
    public void testSessionManagement() {
        List<UserSessionResponse> sessions = accountService.getSessions(activeUser.id, "current-session");
        Assertions.assertNotNull(sessions);
    }
}
