package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import org.eclipse.microprofile.jwt.JsonWebToken;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiFieldError;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.core.enums.TenantType;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.*;
import com.vn9melody.openerp.modules.iam.dto.*;
import com.vn9melody.openerp.modules.iam.dto.response.*;
import com.vn9melody.openerp.modules.iam.model.*;

@ApplicationScoped
public class AuthService {
    private static final long ACCESS_TOKEN_TTL_SECONDS = 900;
    private static final long RESET_TOKEN_TTL_SECONDS = 900;
    private static final int RESET_TOKEN_BYTES = 32;
    private static final Pattern TENANT_SLUG_PATTERN = Pattern.compile("^[a-z0-9]([a-z0-9-]{1,62})$");
    private static final Set<String> RESERVED_TENANT_SLUGS = Set.of("api", "admin", "core", "www", "app");
    private final SecureRandom secureRandom = new SecureRandom();

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    TotpService totpService;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    @Inject
    BruteForceService bruteForceService;

    @Inject
    VerificationOtpService verificationOtpService;

    @Inject
    PreAuthSessionService preAuthSessionService;

    @Inject
    TokenBlacklistService tokenBlacklistService;

    @Inject
    EmailNotificationService emailNotificationService;

    @Transactional
    public PersonalRegisterResponse registerPersonal(PersonalRegisterRequest req) {
        if (User.findByEmail(req.email) != null) {
            Map<String, Object> params = new HashMap<>();
            params.put(ResponseKey.FIELD.getKey(), "email");
            List<ApiFieldError> errors = List.of(
                new ApiFieldError("email", ErrorCode.VALIDATION_EMAIL_DUPLICATE, new HashMap<>())
            );
            throw new ApiException(409, ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, "Email is already taken", params, errors);
        }

        User user = new User();
        user.email = req.email.toLowerCase().trim();
        user.status = AccountStatus.PENDING_VERIFICATION;
        user.persist();

        UserCredential credential = new UserCredential();
        credential.user = user;
        credential.userId = user.id;
        credential.passwordHash = passwordHashService.hashPassword(req.password);
        credential.persist();

        UserProfile profile = new UserProfile();
        profile.user = user;
        profile.userId = user.id;
        profile.fullName = req.fullName.trim();
        profile.phone = req.phone;
        profile.persist();

        String otp = verificationOtpService.issueOtp(user.id);
        emailNotificationService.sendVerificationOtp(user.email, otp);

        return new PersonalRegisterResponse(user.id.toString(), user.email, user.status);
    }

    @Transactional
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest req) {
        User user = User.findByEmail(req.email);
        if (user == null || user.status != AccountStatus.PENDING_VERIFICATION) {
            throw new ApiException(400, ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED, "Verification code invalid or expired");
        }

        if (!verificationOtpService.verifyOtp(user.id, req.otpCode)) {
            throw new ApiException(400, ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED, "Verification code invalid or expired");
        }

        user.status = AccountStatus.ACTIVE;
        user.emailVerifiedAt = Instant.now();
        user.persist();

        String personalSlug = "u-" + user.id.toString().substring(0, 8);
        Tenant personalTenant = new Tenant();
        personalTenant.slug = personalSlug;
        personalTenant.name = "Không gian cá nhân";
        personalTenant.type = TenantType.PERSONAL;
        personalTenant.persist();

        UserTenant ut = new UserTenant();
        ut.id = new UserTenantId(user.id, personalTenant.id);
        ut.user = user;
        ut.tenant = personalTenant;
        ut.role = UserRole.TENANT_ADMIN;
        ut.isDefault = true;
        ut.persist();

        return new VerifyEmailResponse(AccountStatus.ACTIVE, personalTenant.id.toString());
    }

    @Transactional
    public BusinessRegisterResponse registerBusiness(BusinessRegisterRequest req) {
        String slug = req.tenant.slug.toLowerCase().trim();
        if (Tenant.findBySlug(slug) != null) {
            Map<String, Object> params = new HashMap<>();
            params.put(ResponseKey.SLUG.getKey(), slug);
            List<ApiFieldError> errors = List.of(
                new ApiFieldError("slug", ErrorCode.VALIDATION_SLUG_DUPLICATE, new HashMap<>())
            );
            throw new ApiException(409, ErrorCode.AUTH_TENANT_SLUG_DUPLICATE, "Tenant slug is already taken", params, errors);
        }

        String adminEmail = req.admin.email.toLowerCase().trim();
        if (User.findByEmail(adminEmail) != null) {
            Map<String, Object> params = new HashMap<>();
            params.put(ResponseKey.FIELD.getKey(), "email");
            List<ApiFieldError> errors = List.of(
                new ApiFieldError("email", ErrorCode.VALIDATION_EMAIL_DUPLICATE, new HashMap<>())
            );
            throw new ApiException(409, ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, "Email is already taken", params, errors);
        }

        Tenant tenant = new Tenant();
        tenant.slug = slug;
        tenant.name = req.tenant.name.trim();
        tenant.type = TenantType.BUSINESS;
        tenant.taxCode = req.tenant.taxCode;
        tenant.companySize = req.tenant.companySize;
        tenant.currency = req.tenant.currency != null ? req.tenant.currency : "VND";
        tenant.persist();

        User user = new User();
        user.email = adminEmail;
        user.status = AccountStatus.ACTIVE;
        user.emailVerifiedAt = Instant.now();
        user.persist();

        UserCredential cred = new UserCredential();
        cred.user = user;
        cred.userId = user.id;
        cred.passwordHash = passwordHashService.hashPassword(req.admin.password);
        cred.persist();

        UserProfile profile = new UserProfile();
        profile.user = user;
        profile.userId = user.id;
        profile.fullName = req.admin.fullName.trim();
        profile.persist();

        UserTenant ut = new UserTenant();
        ut.id = new UserTenantId(user.id, tenant.id);
        ut.user = user;
        ut.tenant = tenant;
        ut.role = UserRole.TENANT_ADMIN;
        ut.isDefault = true;
        ut.persist();

        emailNotificationService.sendBusinessWelcomeEmail(user.email, tenant.name, tenant.slug);

        return new BusinessRegisterResponse(tenant.id.toString(), tenant.slug, user.id.toString(), UserRole.TENANT_ADMIN);
    }

    @Transactional
    public AuthResponse login(LoginRequest req, String device, String ipAddress) {
        String email = req.email.toLowerCase().trim();

        if (bruteForceService.isLocked(email)) {
            throwLockedException(bruteForceService.getRemainingLockSeconds(email));
        }

        User user = User.findByEmail(email);
        if (user != null) {
            UserCredential credential = UserCredential.findByUserId(user.id);
            if (credential != null && credential.lockedUntil != null && Instant.now().isBefore(credential.lockedUntil)) {
                throwLockedException(Duration.between(Instant.now(), credential.lockedUntil).getSeconds());
            }
        }

        if (user == null || user.status != AccountStatus.ACTIVE) {
            recordFailedLogin(email, user);
            throw new ApiException(401, ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid email or password");
        }

        UserCredential credential = UserCredential.findByUserId(user.id);
        if (credential == null || !passwordHashService.checkPassword(req.password, credential.passwordHash)) {
            recordFailedLogin(email, user);
            throw new ApiException(401, ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid email or password");
        }

        bruteForceService.resetAttempts(email);
        resetCredentialLock(credential);

        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(user.id);
        if (twoFactor != null && Boolean.TRUE.equals(twoFactor.isEnabled)) {
            String jti = UUID.randomUUID().toString();
            preAuthSessionService.create(jti, user.id, "2FA_CHALLENGE");
            String preAuthToken = jwtTokenService.generatePreAuthToken(user.id, "2FA_CHALLENGE", jti);
            return AuthResponse.for2FaChallenge(preAuthToken);
        }

        return resolveTenantAndIssueToken(user, device, ipAddress);
    }

    public AuthResponse resolveTenantAndIssueToken(User user, String device, String ipAddress) {
        List<UserTenant> userTenants = UserTenant.listByUserId(user.id);

        if (userTenants.isEmpty()) {
            Tenant personalTenant = new Tenant();
            personalTenant.slug = "u-" + user.id.toString().substring(0, 8);
            personalTenant.name = "Không gian cá nhân";
            personalTenant.type = TenantType.PERSONAL;
            personalTenant.persist();

            UserTenant ut = new UserTenant();
            ut.id = new UserTenantId(user.id, personalTenant.id);
            ut.user = user;
            ut.tenant = personalTenant;
            ut.role = UserRole.TENANT_ADMIN;
            ut.isDefault = true;
            ut.persist();
            userTenants = List.of(ut);
        }

        if (userTenants.size() == 1) {
            UserTenant ut = userTenants.get(0);
            return issueTokensForTenant(user, ut.tenant, ut.role != null ? ut.role.name() : "MEMBER", device, ipAddress);
        }

        String jti = UUID.randomUUID().toString();
        preAuthSessionService.create(jti, user.id, "SELECT_TENANT");
        String preAuthToken = jwtTokenService.generatePreAuthToken(user.id, "SELECT_TENANT", jti);
        List<TenantItemResponse> tenantsList = new ArrayList<>();
        for (UserTenant ut : userTenants) {
            tenantsList.add(new TenantItemResponse(
                ut.tenant.id.toString(),
                ut.tenant.name,
                ut.tenant.slug,
                ut.role != null ? ut.role.name() : "MEMBER",
                ut.isDefault != null && ut.isDefault
            ));
        }

        return AuthResponse.forTenantSelection(preAuthToken, tenantsList);
    }

    @Transactional
    public AuthResponse selectTenant(UUID userId, UUID tenantId, String device, String ipAddress, String preAuthJti) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "User not found");
        }

        UserTenant ut = UserTenant.findByUserAndTenant(userId, tenantId);
        if (ut == null) {
            throw new ApiException(403, ErrorCode.FORBIDDEN, "User does not belong to selected tenant");
        }

        AuthResponse response = issueTokensForTenant(user, ut.tenant, ut.role != null ? ut.role.name() : "MEMBER", device, ipAddress);
        preAuthSessionService.delete(preAuthJti);
        return response;
    }

    private AuthResponse issueTokensForTenant(User user, Tenant tenant, String role, String device, String ipAddress) {
        String sessionId = sessionManager.createSession(user.id, device, ipAddress);
        String accessToken = jwtTokenService.generateAccessToken(user.id, user.email, tenant.id, role, sessionId);
        String refreshToken = jwtTokenService.generateRefreshToken(user.id, tenant.id, role, sessionId);

        UserProfile profile = UserProfile.findByUserId(user.id);

        AuthUserInfo userInfo = new AuthUserInfo(
            user.id.toString(),
            user.email,
            profile != null ? profile.fullName : "",
            tenant.id.toString(),
            tenant.name,
            tenant.slug,
            role
        );

        return AuthResponse.forSuccess(accessToken, refreshToken, sessionId, (int) ACCESS_TOKEN_TTL_SECONDS, userInfo);
    }

    @Transactional
    public RefreshTokenResponse refresh(String refreshToken) {
        JsonWebToken jwt;
        try {
            jwt = jwtTokenService.parseToken(refreshToken);
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED, "Refresh token is invalid or revoked");
        }

        if (!JwtTokenService.TYPE_REFRESH.equals(jwt.getClaim("type"))) {
            throw new ApiException(401, ErrorCode.AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED, "Refresh token is invalid or revoked");
        }

        UUID userId;
        try {
            userId = UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED, "Refresh token is invalid or revoked");
        }

        String sessionId = jwt.getClaim("session_id");
        if (sessionId == null || !sessionManager.isSessionActive(userId, sessionId)) {
            throw new ApiException(401, ErrorCode.AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED, "Refresh token is invalid or revoked");
        }

        User user = User.findById(userId);
        if (user == null || user.status != AccountStatus.ACTIVE) {
            throw new ApiException(401, ErrorCode.AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED, "Refresh token is invalid or revoked");
        }

        String tenantIdClaim = jwt.getClaim("tenant_id");
        UUID tenantId = tenantIdClaim != null ? UUID.fromString(tenantIdClaim) : null;
        String role = jwt.getClaim("role");

        String accessToken = jwtTokenService.generateAccessToken(userId, user.email, tenantId, role, sessionId);
        return new RefreshTokenResponse(accessToken, (int) ACCESS_TOKEN_TTL_SECONDS);
    }

    public void logout(UUID userId, String sessionId, String jti, long ttlSeconds) {
        sessionManager.revokeSession(userId, sessionId);
        tokenBlacklistService.blacklist(jti, ttlSeconds);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = User.findByEmail(email);
        if (user == null || user.status != AccountStatus.PENDING_VERIFICATION) {
            return;
        }

        if (!verificationOtpService.canResend(user.id)) {
            Map<String, Object> params = new HashMap<>();
            params.put(ResponseKey.RETRY_AFTER.getKey(), verificationOtpService.getResendRemainingSeconds(user.id));
            throw new ApiException(429, ErrorCode.AUTH_OTP_RESEND_TOO_SOON, "Please wait before requesting a new verification code", params);
        }

        String otp = verificationOtpService.issueOtp(user.id);
        verificationOtpService.markResent(user.id);
        emailNotificationService.sendVerificationOtp(user.email, otp);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = User.findByEmail(email);
        if (user != null && user.status == AccountStatus.ACTIVE) {
            PasswordResetToken.delete("user.id = ?1 and usedAt is null", user.id);

            String rawToken = generateSecureToken();
            PasswordResetToken prt = new PasswordResetToken();
            prt.user = user;
            prt.tokenHash = totpService.sha256Hex(rawToken);
            prt.expiresAt = Instant.now().plusSeconds(RESET_TOKEN_TTL_SECONDS);
            prt.persist();

            emailNotificationService.sendPasswordResetEmail(user.email, rawToken);
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new ApiException(400, ErrorCode.AUTH_RESET_TOKEN_INVALID_OR_EXPIRED, "Reset token is invalid or has expired");
        }

        PasswordResetToken prt = PasswordResetToken.findValidToken(totpService.sha256Hex(token.trim()));
        if (prt == null) {
            throw new ApiException(400, ErrorCode.AUTH_RESET_TOKEN_INVALID_OR_EXPIRED, "Reset token is invalid or has expired");
        }

        User user = prt.user;
        UserCredential credential = UserCredential.findByUserId(user.id);
        if (credential != null) {
            credential.passwordHash = passwordHashService.hashPassword(newPassword);
            credential.passwordUpdatedAt = Instant.now();
            credential.failedLoginCount = 0;
            credential.lockedUntil = null;
            credential.persist();
        }

        prt.usedAt = Instant.now();
        prt.persist();

        sessionManager.revokeAllSessions(user.id);
        bruteForceService.resetAttempts(user.email);
    }

    private void recordFailedLogin(String email, User user) {
        bruteForceService.recordFailedAttempt(email);
        if (user == null) {
            return;
        }
        UUID userId = user.id;
        QuarkusTransaction.requiringNew().run(() -> {
            UserCredential credential = UserCredential.findByUserId(userId);
            if (credential != null) {
                int failedCount = (credential.failedLoginCount != null ? credential.failedLoginCount : 0) + 1;
                credential.failedLoginCount = failedCount;
                if (failedCount >= 5) {
                    credential.lockedUntil = Instant.now().plusSeconds(900);
                }
                credential.persist();
            }
        });
    }

    private void resetCredentialLock(UserCredential credential) {
        if (credential != null) {
            credential.failedLoginCount = 0;
            credential.lockedUntil = null;
            credential.persist();
        }
    }

    private void throwLockedException(long remainingSeconds) {
        Map<String, Object> params = new HashMap<>();
        params.put(ResponseKey.LOCKED_SECONDS.getKey(), remainingSeconds);
        throw new ApiException(423, ErrorCode.AUTH_ACCOUNT_LOCKED, "Account locked due to excessive failed attempts", params);
    }

    public String normalizeTenantSlug(String slug) {
        return slug == null ? null : slug.trim().toLowerCase();
    }

    public boolean isTenantSlugValid(String slug) {
        String normalized = normalizeTenantSlug(slug);
        if (normalized == null || normalized.isEmpty()) {
            return false;
        }
        return TENANT_SLUG_PATTERN.matcher(normalized).matches()
            && !RESERVED_TENANT_SLUGS.contains(normalized);
    }

    public boolean isTenantSlugAvailable(String slug) {
        String normalized = normalizeTenantSlug(slug);
        if (normalized == null || normalized.isEmpty()) {
            return false;
        }
        return Tenant.findBySlug(normalized) == null;
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[RESET_TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
