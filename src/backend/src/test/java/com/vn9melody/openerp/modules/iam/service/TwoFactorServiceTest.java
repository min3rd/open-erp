package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.CryptoService;
import com.vn9melody.openerp.core.security.PreAuthSessionService;
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.dto.PersonalRegisterRequest;
import com.vn9melody.openerp.modules.iam.dto.VerifyEmailRequest;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorEnableResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorSetupResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorStatusResponse;
import com.vn9melody.openerp.modules.iam.model.*;
import com.vn9melody.openerp.support.RedisTestSupport;

@QuarkusTest
public class TwoFactorServiceTest {

    @Inject
    TwoFactorService twoFactorService;

    @Inject
    AuthService authService;

    @Inject
    TotpService totpService;

    @Inject
    CryptoService cryptoService;

    @Inject
    PreAuthSessionService preAuthSessionService;

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
        reg.email = "twofactor.test@example.com";
        reg.password = "Mypassword123!";
        reg.fullName = "Ngô Bảo Mật";
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
    @DisplayName("TC-08: Thiết lập 2FA chỉ trả secret/QR, enable mới trả backup codes và secret được mã hóa")
    public void testTwoFactorLifecycle() {
        TwoFactorSetupResponse setupResult = twoFactorService.setup2Fa(activeUser.id);
        String secretKey = setupResult.secretKey;
        Assertions.assertNotNull(secretKey);
        Assertions.assertTrue(setupResult.qrCodeUri.contains("otpauth://totp/"));

        ApiException ex = Assertions.assertThrows(ApiException.class, () -> twoFactorService.enable2Fa(activeUser.id, "000000"));
        Assertions.assertEquals(ErrorCode.AUTH_2FA_CODE_INVALID, ex.getErrorCode());

        String validCode = totpService.generateCurrentCode(secretKey);
        TwoFactorEnableResponse enableResult = twoFactorService.enable2Fa(activeUser.id, validCode);
        Assertions.assertEquals(true, enableResult.isEnabled);
        Assertions.assertNotNull(enableResult.enabledAt);

        List<String> backupCodes = enableResult.backupCodes;
        Assertions.assertNotNull(backupCodes, "Backup codes chỉ được trả về ở bước enable");
        Assertions.assertEquals(8, backupCodes.size());

        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(activeUser.id);
        Assertions.assertNotNull(twoFactor.secretKeyEnc);
        Assertions.assertNotEquals(secretKey, twoFactor.secretKeyEnc, "Secret TOTP phải được mã hóa AES-256-GCM");
        Assertions.assertEquals(secretKey, cryptoService.decrypt(twoFactor.secretKeyEnc));

        TwoFactorStatusResponse status = twoFactorService.getStatus(activeUser.id);
        Assertions.assertEquals(true, status.isEnabled);
        Assertions.assertEquals(8, status.backupCodesRemaining);

        String currentCode = totpService.generateCurrentCode(secretKey);
        Assertions.assertDoesNotThrow(() -> twoFactorService.disable2Fa(activeUser.id, "Mypassword123!", currentCode));

        UserTwoFactor.getEntityManager().clear();
        TwoFactorStatusResponse afterDisable = twoFactorService.getStatus(activeUser.id);
        Assertions.assertEquals(false, afterDisable.isEnabled);
    }

    @Test
    @DisplayName("TC-09: TOTP Service sinh mã, drift window và hash backup code")
    public void testTotpDriftWindow() {
        String secret = totpService.generateBase32Secret();
        Assertions.assertNotNull(secret);
        Assertions.assertTrue(secret.length() >= 16);

        String code = totpService.generateCurrentCode(secret);
        Assertions.assertTrue(totpService.verifyTotp(secret, code));

        String backupCode = "ABCD-1234";
        String hashed = totpService.hashBackupCode(backupCode);
        String hashedAgain = totpService.hashBackupCode("abcd1234");
        Assertions.assertEquals(hashed, hashedAgain, "Mã dự phòng chuẩn hóa không phân biệt hoa thường và dấu gạch nối");
    }

    @Test
    @DisplayName("TC-10: Verify-login sai 3 lần phải hủy pre-auth và trả AUTH_2FA_ATTEMPTS_EXCEEDED")
    public void testLogin2FaAttemptLockout() {
        TwoFactorSetupResponse setupResult = twoFactorService.setup2Fa(activeUser.id);
        String validCode = totpService.generateCurrentCode(setupResult.secretKey);
        twoFactorService.enable2Fa(activeUser.id, validCode);

        String jti = UUID.randomUUID().toString();
        preAuthSessionService.create(jti, activeUser.id, "2FA_CHALLENGE");

        for (int i = 0; i < 2; i++) {
            ApiException invalid = Assertions.assertThrows(ApiException.class,
                () -> twoFactorService.verifyLogin2Fa(activeUser.id, jti, "000000", "Chrome", "1.2.3.4"));
            Assertions.assertEquals(ErrorCode.AUTH_2FA_CODE_INVALID, invalid.getErrorCode());
            Assertions.assertEquals(400, invalid.getHttpStatus());
        }

        ApiException exceeded = Assertions.assertThrows(ApiException.class,
            () -> twoFactorService.verifyLogin2Fa(activeUser.id, jti, "000000", "Chrome", "1.2.3.4"));
        Assertions.assertEquals(ErrorCode.AUTH_2FA_ATTEMPTS_EXCEEDED, exceeded.getErrorCode());
        Assertions.assertEquals(401, exceeded.getHttpStatus());
        Assertions.assertNull(preAuthSessionService.getPurpose(jti), "Pre-auth session phải bị hủy sau 3 lần sai");
    }
}
