package com.vn9melody.openerp.modules.iam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.*;
import org.jboss.logging.Logger;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.dto.response.AuthResponse;
import com.vn9melody.openerp.modules.iam.dto.response.BackupCodesResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorEnableResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorSetupResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorStatusResponse;
import com.vn9melody.openerp.modules.iam.model.*;

@ApplicationScoped
public class TwoFactorService {
    private static final Logger LOG = Logger.getLogger(TwoFactorService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Inject
    TotpService totpService;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    AuthService authService;

    @Inject
    EmailNotificationService emailNotificationService;

    public TwoFactorStatusResponse getStatus(UUID userId) {
        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(userId);
        boolean isEnabled = twoFactor != null && Boolean.TRUE.equals(twoFactor.isEnabled);
        String enabledAt = isEnabled && twoFactor.enabledAt != null ? twoFactor.enabledAt.toString() : null;

        int remainingCodes = 0;
        if (isEnabled && twoFactor.backupCodesHash != null) {
            try {
                List<String> list = objectMapper.readValue(twoFactor.backupCodesHash, new TypeReference<List<String>>() {});
                remainingCodes = list.size();
            } catch (Exception ignored) {}
        }
        return new TwoFactorStatusResponse(isEnabled, enabledAt, remainingCodes);
    }

    @Transactional
    public TwoFactorSetupResponse setup2Fa(UUID userId) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "User not found");
        }

        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(userId);
        if (twoFactor != null && Boolean.TRUE.equals(twoFactor.isEnabled)) {
            throw new ApiException(400, ErrorCode.ACCOUNT_2FA_ALREADY_ENABLED, "2FA is already enabled on this account");
        }

        if (twoFactor == null) {
            twoFactor = new UserTwoFactor();
            twoFactor.user = user;
            twoFactor.userId = user.id;
        }

        String secretKey = totpService.generateBase32Secret();
        List<String> backupCodes = totpService.generateBackupCodes(8);
        String qrCodeUri = totpService.generateQrCodeUri(user.email, secretKey);

        // Lưu tạm secret và backup codes hash
        twoFactor.tempSecretKey = secretKey;
        try {
            List<String> hashedCodes = backupCodes.stream().map(totpService::hashBackupCode).toList();
            twoFactor.backupCodesHash = objectMapper.writeValueAsString(hashedCodes);
        } catch (Exception e) {
            throw new RuntimeException("Error serializing backup codes", e);
        }
        twoFactor.persist();

        return new TwoFactorSetupResponse(secretKey, qrCodeUri, backupCodes);
    }

    @Transactional
    public TwoFactorEnableResponse enable2Fa(UUID userId, String code) {
        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(userId);
        if (twoFactor == null || twoFactor.tempSecretKey == null) {
            throw new ApiException(400, ErrorCode.ACCOUNT_2FA_NOT_ENABLED, "2FA setup was not initiated");
        }

        boolean isValid = totpService.verifyTotp(twoFactor.tempSecretKey, code);
        if (!isValid) {
            throw new ApiException(400, ErrorCode.AUTH_2FA_CODE_INVALID, "Invalid two-factor authentication code");
        }

        twoFactor.secretKeyEnc = twoFactor.tempSecretKey;
        twoFactor.tempSecretKey = null;
        twoFactor.isEnabled = true;
        twoFactor.enabledAt = Instant.now();
        twoFactor.persist();

        return new TwoFactorEnableResponse(true, twoFactor.enabledAt.toString());
    }

    @Transactional
    public void disable2Fa(UUID userId, String currentPassword, String code) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "User not found");
        }

        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(userId);
        if (twoFactor == null || !Boolean.TRUE.equals(twoFactor.isEnabled)) {
            throw new ApiException(400, ErrorCode.ACCOUNT_2FA_NOT_ENABLED, "2FA is not enabled on this account");
        }

        // 1. Xác thực mật khẩu hiện tại
        UserCredential credential = UserCredential.findByUserId(userId);
        if (credential == null || !passwordHashService.checkPassword(currentPassword, credential.passwordHash)) {
            throw new ApiException(401, ErrorCode.ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE, "Current password or 2FA code is invalid");
        }

        // 2. Xác thực mã 2FA hiện tại (hoặc Backup Code)
        boolean codeValid = verifyCodeOrBackup(twoFactor, code);
        if (!codeValid) {
            throw new ApiException(401, ErrorCode.ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE, "Current password or 2FA code is invalid");
        }

        // 3. Vô hiệu hóa và xóa toàn bộ Secret Key cùng Backup Codes
        twoFactor.isEnabled = false;
        twoFactor.secretKeyEnc = null;
        twoFactor.tempSecretKey = null;
        twoFactor.backupCodesHash = "[]";
        twoFactor.enabledAt = null;
        twoFactor.persist();

        // 4. Gửi email cảnh báo bảo mật tức thời
        emailNotificationService.send2FaDisabledAlert(user.email);
    }

    @Transactional
    public BackupCodesResponse regenerateBackupCodes(UUID userId, String currentPassword) {
        UserCredential credential = UserCredential.findByUserId(userId);
        if (credential == null || !passwordHashService.checkPassword(currentPassword, credential.passwordHash)) {
            throw new ApiException(401, ErrorCode.ACCOUNT_OLD_PASSWORD_INCORRECT, "Current password is incorrect");
        }

        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(userId);
        if (twoFactor == null || !Boolean.TRUE.equals(twoFactor.isEnabled)) {
            throw new ApiException(400, ErrorCode.ACCOUNT_2FA_NOT_ENABLED, "2FA is not enabled on this account");
        }

        List<String> newCodes = totpService.generateBackupCodes(8);
        try {
            List<String> hashed = newCodes.stream().map(totpService::hashBackupCode).toList();
            twoFactor.backupCodesHash = objectMapper.writeValueAsString(hashed);
            twoFactor.persist();
        } catch (Exception e) {
            throw new RuntimeException("Error saving backup codes", e);
        }
        return new BackupCodesResponse(newCodes);
    }

    @Transactional
    public AuthResponse verifyLogin2Fa(UUID userId, String code, String device, String ipAddress) {
        User user = User.findById(userId);
        if (user == null || user.status != AccountStatus.ACTIVE) {
            throw new ApiException(401, ErrorCode.AUTH_INVALID_CREDENTIALS, "User not found or inactive");
        }

        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(userId);
        if (twoFactor == null || !Boolean.TRUE.equals(twoFactor.isEnabled)) {
            throw new ApiException(400, ErrorCode.ACCOUNT_2FA_NOT_ENABLED, "2FA is not enabled on this account");
        }

        boolean valid = verifyCodeOrBackup(twoFactor, code);
        if (!valid) {
            throw new ApiException(400, ErrorCode.AUTH_2FA_CODE_INVALID, "Invalid two-factor authentication code");
        }

        twoFactor.persist();
        return authService.resolveTenantAndIssueToken(user, device, ipAddress);
    }

    private boolean verifyCodeOrBackup(UserTwoFactor twoFactor, String code) {
        // Thử TOTP trước
        if (twoFactor.secretKeyEnc != null && totpService.verifyTotp(twoFactor.secretKeyEnc, code)) {
            return true;
        }

        // Thử Backup Code
        if (twoFactor.backupCodesHash != null) {
            try {
                List<String> hashes = new ArrayList<>(objectMapper.readValue(twoFactor.backupCodesHash, new TypeReference<List<String>>() {}));
                String hashedInput = totpService.hashBackupCode(code);
                if (hashes.contains(hashedInput)) {
                    // Tiêu hủy mã dự phòng đã dùng (single-use)
                    hashes.remove(hashedInput);
                    twoFactor.backupCodesHash = objectMapper.writeValueAsString(hashes);
                    return true;
                }
            } catch (Exception ignored) {}
        }
        return false;
    }
}
