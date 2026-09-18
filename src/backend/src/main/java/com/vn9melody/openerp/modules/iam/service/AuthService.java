package com.vn9melody.openerp.modules.iam.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import org.jboss.logging.Logger;
import com.vn9melody.openerp.core.api.ApiException;
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
    private static final Logger LOG = Logger.getLogger(AuthService.class);
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
    EmailNotificationService emailNotificationService;

    @Transactional
    public PersonalRegisterResponse registerPersonal(PersonalRegisterRequest req) {
        if (User.findByEmail(req.email) != null) {
            Map<String, Object> params = new HashMap<>();
            params.put("field", "email");
            throw new ApiException(409, ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, "Email is already taken", params);
        }

        User user = new User();
        user.email = req.email.toLowerCase().trim();
        user.status = AccountStatus.PENDING_VERIFICATION;
        
        // Sinh OTP 6 số (hạn 15 phút)
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        user.verificationOtp = otp;
        user.verificationOtpExpiresAt = Instant.now().plusSeconds(900);
        user.persist();

        // Hash mật khẩu
        UserCredential credential = new UserCredential();
        credential.user = user;
        credential.userId = user.id;
        credential.passwordHash = passwordHashService.hashPassword(req.password);
        credential.persist();

        // Tạo profile
        UserProfile profile = new UserProfile();
        profile.user = user;
        profile.userId = user.id;
        profile.fullName = req.fullName.trim();
        profile.phone = req.phone;
        profile.persist();

        // Gửi email OTP
        emailNotificationService.sendVerificationOtp(user.email, otp);

        return new PersonalRegisterResponse(user.id.toString(), user.email, user.status);
    }

    @Transactional
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest req) {
        User user = User.findByEmail(req.email);
        if (user == null) {
            throw new ApiException(400, ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED, "Verification code invalid or expired");
        }

        if (user.verificationOtp == null || !user.verificationOtp.equals(req.otpCode.trim())) {
            throw new ApiException(400, ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED, "Verification code invalid or expired");
        }

        if (user.verificationOtpExpiresAt == null || Instant.now().isAfter(user.verificationOtpExpiresAt)) {
            throw new ApiException(400, ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED, "Verification code invalid or expired");
        }

        user.status = AccountStatus.ACTIVE;
        user.emailVerifiedAt = Instant.now();
        user.verificationOtp = null;
        user.verificationOtpExpiresAt = null;
        user.persist();

        // Tự động cấp Personal Workspace
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
            params.put("slug", slug);
            throw new ApiException(409, ErrorCode.AUTH_TENANT_SLUG_DUPLICATE, "Tenant slug is already taken", params);
        }

        String adminEmail = req.admin.email.toLowerCase().trim();
        if (User.findByEmail(adminEmail) != null) {
            Map<String, Object> params = new HashMap<>();
            params.put("field", "email");
            throw new ApiException(409, ErrorCode.AUTH_EMAIL_ALREADY_EXISTS, "Email is already taken", params);
        }

        // Tạo Tenant
        Tenant tenant = new Tenant();
        tenant.slug = slug;
        tenant.name = req.tenant.name.trim();
        tenant.type = TenantType.ORGANIZATION;
        tenant.taxCode = req.tenant.taxCode;
        tenant.companySize = req.tenant.companySize;
        tenant.currency = req.tenant.currency != null ? req.tenant.currency : "VND";
        tenant.persist();

        // Tạo Admin User
        User user = new User();
        user.email = adminEmail;
        user.status = AccountStatus.ACTIVE;
        user.emailVerifiedAt = Instant.now();
        user.persist();

        // Mật khẩu
        UserCredential cred = new UserCredential();
        cred.user = user;
        cred.userId = user.id;
        cred.passwordHash = passwordHashService.hashPassword(req.admin.password);
        cred.persist();

        // Profile
        UserProfile profile = new UserProfile();
        profile.user = user;
        profile.userId = user.id;
        profile.fullName = req.admin.fullName.trim();
        profile.persist();

        // Liên kết UserTenant TENANT_ADMIN
        UserTenant ut = new UserTenant();
        ut.id = new UserTenantId(user.id, tenant.id);
        ut.user = user;
        ut.tenant = tenant;
        ut.role = UserRole.TENANT_ADMIN;
        ut.isDefault = true;
        ut.persist();

        return new BusinessRegisterResponse(tenant.id.toString(), tenant.slug, user.id.toString(), UserRole.TENANT_ADMIN);
    }

    @Transactional
    public AuthResponse login(LoginRequest req, String device, String ipAddress) {
        String email = req.email.toLowerCase().trim();

        // 1. Kiểm tra Brute-Force Lock
        if (bruteForceService.isLocked(email)) {
            long remaining = bruteForceService.getRemainingLockSeconds(email);
            Map<String, Object> params = new HashMap<>();
            params.put("locked_seconds", remaining);
            throw new ApiException(423, ErrorCode.AUTH_ACCOUNT_LOCKED, "Account locked due to excessive failed attempts", params);
        }

        // 2. Tìm User & kiểm tra trạng thái
        User user = User.findByEmail(email);
        if (user == null || user.status != AccountStatus.ACTIVE) {
            bruteForceService.recordFailedAttempt(email);
            throw new ApiException(401, ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid email or password");
        }

        // 3. Kiểm tra mật khẩu
        UserCredential credential = UserCredential.findByUserId(user.id);
        if (credential == null || !passwordHashService.checkPassword(req.password, credential.passwordHash)) {
            bruteForceService.recordFailedAttempt(email);
            throw new ApiException(401, ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid email or password");
        }

        // Reset brute-force khi mật khẩu đúng
        bruteForceService.resetAttempts(email);

        // 4. Kiểm tra 2FA
        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(user.id);
        if (twoFactor != null && Boolean.TRUE.equals(twoFactor.isEnabled)) {
            String preAuthToken = jwtTokenService.generatePreAuthToken(user.id, "2FA_CHALLENGE");
            return AuthResponse.for2FaChallenge(preAuthToken);
        }

        // 5. Phân giải Tenant (Multi-Tenant Resolution)
        return resolveTenantAndIssueToken(user, device, ipAddress);
    }

    public AuthResponse resolveTenantAndIssueToken(User user, String device, String ipAddress) {
        List<UserTenant> userTenants = UserTenant.listByUserId(user.id);

        if (userTenants.isEmpty()) {
            // Trường hợp hy hữu: Chưa có workspace -> sinh personal workspace
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

        // Nhiều Tenant -> Yêu cầu Workspace Picker
        String preAuthToken = jwtTokenService.generatePreAuthToken(user.id, "SELECT_TENANT");
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

    public AuthResponse selectTenant(UUID userId, UUID tenantId, String device, String ipAddress) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "User not found");
        }

        UserTenant ut = UserTenant.findByUserAndTenant(userId, tenantId);
        if (ut == null) {
            throw new ApiException(403, ErrorCode.FORBIDDEN, "User does not belong to selected tenant");
        }

        return issueTokensForTenant(user, ut.tenant, ut.role != null ? ut.role.name() : "MEMBER", device, ipAddress);
    }

    private AuthResponse issueTokensForTenant(User user, Tenant tenant, String role, String device, String ipAddress) {
        String accessToken = jwtTokenService.generateAccessToken(user.id, user.email, tenant.id, role);
        String refreshToken = jwtTokenService.generateRefreshToken(user.id);
        String sessionId = sessionManager.createSession(user.id, device, ipAddress);

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

        return AuthResponse.forSuccess(accessToken, refreshToken, sessionId, 900, userInfo);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = User.findByEmail(email);
        if (user != null && user.status == AccountStatus.ACTIVE) {
            String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
            PasswordResetToken prt = new PasswordResetToken();
            prt.user = user;
            prt.tokenHash = token; // Lưu token
            prt.expiresAt = Instant.now().plusSeconds(900); // 15 mins
            prt.persist();

            emailNotificationService.sendPasswordResetEmail(user.email, token);
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = PasswordResetToken.findValidToken(token);
        if (prt == null) {
            throw new ApiException(400, ErrorCode.AUTH_RESET_TOKEN_INVALID_OR_EXPIRED, "Reset token is invalid or has expired");
        }

        User user = prt.user;
        UserCredential credential = UserCredential.findByUserId(user.id);
        if (credential != null) {
            credential.passwordHash = passwordHashService.hashPassword(newPassword);
            credential.passwordUpdatedAt = Instant.now();
            credential.persist();
        }

        prt.usedAt = Instant.now();
        prt.persist();

        // Thu hồi toàn bộ phiên đăng nhập cũ
        sessionManager.revokeAllSessions(user.id);
    }
}
