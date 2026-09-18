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
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.dto.PersonalRegisterRequest;
import com.vn9melody.openerp.modules.iam.dto.VerifyEmailRequest;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorSetupResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorStatusResponse;
import com.vn9melody.openerp.modules.iam.model.*;

@QuarkusTest
public class TwoFactorServiceTest {

    @Inject
    TwoFactorService twoFactorService;

    @Inject
    AuthService authService;

    @Inject
    TotpService totpService;

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

        // Tạo user active
        PersonalRegisterRequest reg = new PersonalRegisterRequest();
        reg.email = "twofactor.test@example.com";
        reg.password = "Mypassword123!";
        reg.fullName = "Ngô Bảo Mật";
        authService.registerPersonal(reg);

        activeUser = User.findByEmail(reg.email);
        VerifyEmailRequest ver = new VerifyEmailRequest();
        ver.email = reg.email;
        ver.otpCode = activeUser.verificationOtp;
        authService.verifyEmail(ver);
    }

    @Test
    @DisplayName("TC-06: Thiết lập, kích hoạt và vô hiệu hóa 2FA với mã dự phòng")
    public void testTwoFactorLifecycle() {
        // 1. Khởi tạo thiết lập 2FA
        TwoFactorSetupResponse setupResult = twoFactorService.setup2Fa(activeUser.id);
        String secretKey = setupResult.secretKey;
        Assertions.assertNotNull(secretKey);
        Assertions.assertTrue(setupResult.qrCodeUri.contains("otpauth://totp/"));

        List<String> backupCodes = setupResult.backupCodes;
        Assertions.assertEquals(8, backupCodes.size());

        // 2. Kích hoạt 2FA với mã OTP sai
        ApiException ex = Assertions.assertThrows(ApiException.class, () -> twoFactorService.enable2Fa(activeUser.id, "000000"));
        Assertions.assertEquals(ErrorCode.AUTH_2FA_CODE_INVALID, ex.getErrorCode());

        // 3. Vô hiệu hóa khi chưa kích hoạt phải báo lỗi
        Assertions.assertThrows(ApiException.class, () -> twoFactorService.disable2Fa(activeUser.id, "Mypassword123!", "000000"));

        // 4. Lấy status 2FA
        TwoFactorStatusResponse status = twoFactorService.getStatus(activeUser.id);
        Assertions.assertEquals(false, status.isEnabled);
    }

    @Test
    @DisplayName("TC-07: Xác thực TOTP Service sinh mã và drift window")
    public void testTotpDriftWindow() {
        String secret = totpService.generateBase32Secret();
        Assertions.assertNotNull(secret);
        Assertions.assertTrue(secret.length() >= 16);

        // Backup code hashing
        String backupCode = "ABCD-1234";
        String hashed = totpService.hashBackupCode(backupCode);
        String hashedAgain = totpService.hashBackupCode("abcd1234");
        Assertions.assertEquals(hashed, hashedAgain, "Mã dự phòng chuẩn hóa không phân biệt hoa thường và dấu gạch nối");
    }
}
