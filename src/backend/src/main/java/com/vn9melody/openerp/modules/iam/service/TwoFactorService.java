package com.vn9melody.openerp.modules.iam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.*;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.security.CryptoService;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.core.security.PreAuthSessionService;
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.dto.response.AuthResponse;
import com.vn9melody.openerp.modules.iam.dto.response.BackupCodesResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorEnableResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorSetupResponse;
import com.vn9melody.openerp.modules.iam.dto.response.TwoFactorStatusResponse;
import com.vn9melody.openerp.modules.iam.model.*;

@ApplicationScoped
public class TwoFactorService {
    private static final int MAX_LOGIN_ATTEMPTS = 3;
    private static final long SETUP_TTL_SECONDS = 600; // 10 minutes

    public static class SetupData {
        public String secret;
        public List<String> codes;

        public SetupData() {}

        public SetupData(String secret, List<String> codes) {
            this.secret = secret;
            this.codes = codes;
        }
    }

    @Inject
    TotpService totpService;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    CryptoService cryptoService;

    @Inject
    PreAuthSessionService preAuthSessionService;

    @Inject
    RedisDataSource redis;

    @Inject
    ObjectMapper objectMapper;

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

        String secretKey = totpService.generateBase32Secret();
        List<String> backupCodes = totpService.generateBackupCodes(8);
        String qrCodeUri = totpService.generateQrCodeUri(user.email, secretKey);

        try {
            valueCommands().setex(setupKey(userId), SETUP_TTL_SECONDS, objectMapper.writeValueAsString(new SetupData(secretKey, backupCodes)));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to store 2FA setup data", e);
        }

        return new TwoFactorSetupResponse(secretKey, qrCodeUri);
    }

    @Transactional
    public TwoFactorEnableResponse enable2Fa(UUID userId, String code) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "User not found");
        }

        String setupJson = valueCommands().get(setupKey(userId));
        if (setupJson == null) {
            throw new ApiException(400, ErrorCode.ACCOUNT_2FA_NOT_ENABLED, "2FA setup was not initiated");
        }

        SetupData setupData;
        try {
            setupData = objectMapper.readValue(setupJson, SetupData.class);
        } catch (Exception e) {
            throw new ApiException(400, ErrorCode.ACCOUNT_2FA_NOT_ENABLED, "2FA setup was not initiated");
        }

        if (!totpService.verifyTotp(setupData.secret, code)) {
            throw new ApiException(400, ErrorCode.AUTH_2FA_CODE_INVALID, "Invalid two-factor authentication code");
        }

        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(userId);
        if (twoFactor == null) {
            twoFactor = new UserTwoFactor();
            twoFactor.user = user;
            twoFactor.userId = user.id;
        }

        twoFactor.secretKeyEnc = cryptoService.encrypt(setupData.secret);
        twoFactor.tempSecretKey = null;
        twoFactor.isEnabled = true;
        twoFactor.enabledAt = Instant.now();
        try {
            List<String> hashedCodes = setupData.codes.stream().map(totpService::hashBackupCode).toList();
            twoFactor.backupCodesHash = objectMapper.writeValueAsString(hashedCodes);
        } catch (Exception e) {
            throw new IllegalStateException("Error serializing backup codes", e);
        }
        twoFactor.persist();

        redis.key(String.class).del(setupKey(userId));

        return new TwoFactorEnableResponse(true, twoFactor.enabledAt.toString(), setupData.codes);
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

        UserCredential credential = UserCredential.findByUserId(userId);
        if (credential == null || !passwordHashService.checkPassword(currentPassword, credential.passwordHash)) {
            throw new ApiException(401, ErrorCode.ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE, "Current password or 2FA code is invalid");
        }

        boolean codeValid = verifyCodeOrBackup(twoFactor, code);
        if (!codeValid) {
            throw new ApiException(401, ErrorCode.ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE, "Current password or 2FA code is invalid");
        }

        twoFactor.isEnabled = false;
        twoFactor.secretKeyEnc = null;
        twoFactor.tempSecretKey = null;
        twoFactor.backupCodesHash = "[]";
        twoFactor.enabledAt = null;
        twoFactor.persist();

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
            throw new IllegalStateException("Error saving backup codes", e);
        }
        return new BackupCodesResponse(newCodes);
    }

    @Transactional
    public AuthResponse verifyLogin2Fa(UUID userId, String preAuthJti, String code, String device, String ipAddress) {
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
            long attempts = preAuthSessionService.incrementAttempts(preAuthJti);
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                preAuthSessionService.delete(preAuthJti);
                throw new ApiException(401, ErrorCode.AUTH_2FA_ATTEMPTS_EXCEEDED, "Too many invalid 2FA attempts. Please log in again.");
            }
            throw new ApiException(400, ErrorCode.AUTH_2FA_CODE_INVALID, "Invalid two-factor authentication code");
        }

        preAuthSessionService.delete(preAuthJti);
        twoFactor.persist();
        return authService.resolveTenantAndIssueToken(user, device, ipAddress);
    }

    private boolean verifyCodeOrBackup(UserTwoFactor twoFactor, String code) {
        if (twoFactor.secretKeyEnc != null) {
            try {
                String secret = cryptoService.decrypt(twoFactor.secretKeyEnc);
                if (totpService.verifyTotp(secret, code)) {
                    return true;
                }
            } catch (Exception ignored) {}
        }

        if (twoFactor.backupCodesHash != null) {
            try {
                List<String> hashes = new ArrayList<>(objectMapper.readValue(twoFactor.backupCodesHash, new TypeReference<List<String>>() {}));
                String hashedInput = totpService.hashBackupCode(code);
                if (hashes.contains(hashedInput)) {
                    hashes.remove(hashedInput);
                    twoFactor.backupCodesHash = objectMapper.writeValueAsString(hashes);
                    return true;
                }
            } catch (Exception ignored) {}
        }
        return false;
    }

    private String setupKey(UUID userId) {
        return "2fa:setup:" + userId;
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }
}
