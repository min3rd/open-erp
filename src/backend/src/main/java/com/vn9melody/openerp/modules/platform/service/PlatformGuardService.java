package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Step-up authentication for sensitive platform actions (confirm current password). */
@ApplicationScoped
public class PlatformGuardService {

    @Inject
    PasswordHashService passwordHashService;

    public void verifyConfirmPassword(UUID actorUserId, String confirmPassword) {
        if (confirmPassword == null || confirmPassword.isBlank()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED,
                "confirm_password is required", Map.of("field", "confirm_password"));
        }
        UserCredential credential = actorUserId != null ? UserCredential.findByUserId(actorUserId) : null;
        if (credential == null || !passwordHashService.checkPassword(confirmPassword, credential.passwordHash)) {
            Map<String, Object> params = new HashMap<>();
            params.put("field", "confirm_password");
            throw new ApiException(401, PlatformErrorCode.PLATFORM_CONFIRM_PASSWORD_INVALID,
                "The confirmation password is incorrect", params);
        }
    }
}
