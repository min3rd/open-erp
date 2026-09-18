package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.TenantType;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.model.PasswordResetToken;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.iam.model.UserTenantId;
import com.vn9melody.openerp.modules.iam.model.UserTwoFactor;
import com.vn9melody.openerp.modules.iam.service.EmailNotificationService;
import com.vn9melody.openerp.support.RedisTestSupport;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.smallrye.jwt.build.Jwt;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

@QuarkusTest
public class AuthResourceApiTest {

    private static final String REGISTER_PATH = "/api/v1/auth/register/personal";
    private static final String VERIFY_EMAIL_PATH = "/api/v1/auth/verify-email";
    private static final String RESEND_PATH = "/api/v1/auth/resend-verification";
    private static final String LOGIN_PATH = "/api/v1/auth/login";
    private static final String REFRESH_PATH = "/api/v1/auth/refresh";
    private static final String LOGOUT_PATH = "/api/v1/auth/logout";
    private static final String VERIFY_2FA_PATH = "/api/v1/auth/2fa/verify-login";
    private static final String SELECT_TENANT_PATH = "/api/v1/auth/select-tenant";
    private static final String CHECK_SLUG_PATH = "/api/v1/auth/check-slug";
    private static final String BUSINESS_REGISTER_PATH = "/api/v1/auth/register/business";
    private static final String PROFILE_PATH = "/api/v1/account/profile";
    private static final String CHANGE_PASSWORD_PATH = "/api/v1/account/change-password";
    private static final String SETUP_2FA_PATH = "/api/v1/account/2fa/setup";
    private static final String ENABLE_2FA_PATH = "/api/v1/account/2fa/enable";
    private static final String DISABLE_2FA_PATH = "/api/v1/account/2fa/disable";

    private static final String PASSWORD = "ApiP@ssw0rd123";
    private static final String FULL_NAME = "API Test User";
    private static final String PHONE = "0901234567";

    @Inject
    TotpService totpService;

    @Inject
    RedisDataSource redis;

    @InjectMock
    EmailNotificationService emailNotificationService;

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
    }

    private Map<String, Object> registerBody(String email) {
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", PASSWORD);
        body.put("full_name", FULL_NAME);
        body.put("phone", PHONE);
        return body;
    }

    private Response postJson(String path, Map<String, Object> body) {
        return given().contentType(ContentType.JSON).body(body).when().post(path);
    }

    private void registerOnly(String email) {
        postJson(REGISTER_PATH, registerBody(email))
            .then()
            .statusCode(201)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_REGISTER_SUCCESS));
    }

    private String captureOtp(String email) {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(emailNotificationService)
            .sendVerificationOtp(ArgumentMatchers.eq(email), otpCaptor.capture());
        return otpCaptor.getValue();
    }

    private void registerAndVerify(String email) {
        registerOnly(email);
        String otp = captureOtp(email);
        postJson(VERIFY_EMAIL_PATH, Map.of("email", email, "otp_code", otp))
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_EMAIL_VERIFIED_SUCCESS));
    }

    private Response login(String email, String password) {
        return postJson(LOGIN_PATH, Map.of("email", email, "password", password));
    }

    private Response loginSuccess(String email) {
        return login(email, PASSWORD)
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS))
            .extract().response();
    }

    @Test
    @DisplayName("TC-01 + TC-12 (API): Envelope đăng ký cá nhân, OTP xác thực email và cấp Personal Workspace")
    public void testRegisterVerifyEmailAndPersonalWorkspace() {
        String email = "api.register@example.com";

        given().contentType(ContentType.JSON)
            .body(registerBody(email))
        .when()
            .post(REGISTER_PATH)
        .then()
            .statusCode(201)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_REGISTER_SUCCESS))
            .body("message", not(emptyOrNullString()))
            .body("data.user_id", not(emptyOrNullString()))
            .body("data.email", equalTo(email))
            .body("data.status", equalTo("PENDING_VERIFICATION"));

        String otp = captureOtp(email);

        postJson(VERIFY_EMAIL_PATH, Map.of("email", email, "otp_code", "000000"))
            .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED));

        postJson(VERIFY_EMAIL_PATH, Map.of("email", email, "otp_code", otp))
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_EMAIL_VERIFIED_SUCCESS))
            .body("data.status", equalTo("ACTIVE"))
            .body("data.personal_tenant_id", not(emptyOrNullString()));
    }

    @Test
    @DisplayName("TC-03 (API): Login cấp token/session, Account API yêu cầu Bearer + Session, sai mật khẩu bị từ chối")
    public void testLoginAndAccountAuthorization() {
        String email = "api.login@example.com";
        registerAndVerify(email);

        Response login = loginSuccess(email);
        String accessToken = login.path("data.access_token");
        String sessionId = login.path("data.session_id");

        given()
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.ACCOUNT_PROFILE_FETCH_SUCCESS))
            .body("data.email", equalTo(email));

        // BUG-34: 401 luôn trả envelope JSON thống nhất
        given()
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));

        login(email, "WrongPassword@123")
            .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.AUTH_INVALID_CREDENTIALS));
    }

    @Test
    @DisplayName("BUG-34 (API): /api/v1/account/profile trả 401 envelope JSON cho thiếu token, token rác và token hết hạn")
    public void testAccountProfileUnauthorizedAlwaysReturnsEnvelope() {
        given()
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));

        given()
            .header("Authorization", "Bearer not-a-valid-jwt")
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));

        String expiredToken = Jwt.issuer("https://openerp.9ms.io.vn/auth")
            .subject(UUID.randomUUID().toString())
            .expiresIn(Duration.ofSeconds(-60))
            .sign();

        given()
            .header("Authorization", "Bearer " + expiredToken)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("BUG-44 (API): user thuộc 2 tenant phải chọn tenant; select-tenant với pre-auth cấp token thành công")
    public void testMultiTenantSelectionFlow() {
        String email = "api.multitenant@example.com";
        registerAndVerify(email);

        UUID secondTenantId = QuarkusTransaction.requiringNew().call(() -> {
            User user = User.findByEmail(email);
            Tenant secondTenant = new Tenant();
            secondTenant.slug = "api-second-workspace";
            secondTenant.name = "Second Workspace";
            secondTenant.type = TenantType.BUSINESS;
            secondTenant.persist();

            UserTenant membership = new UserTenant();
            membership.id = new UserTenantId(user.id, secondTenant.id);
            membership.user = user;
            membership.tenant = secondTenant;
            membership.role = UserRole.TENANT_ADMIN;
            membership.isDefault = false;
            membership.persist();
            return secondTenant.id;
        });

        Response challenge = login(email, PASSWORD)
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_SELECT_TENANT_REQUIRED))
            .body("data.requires_tenant_selection", equalTo(true))
            .body("data.pre_auth_token", not(emptyOrNullString()))
            .body("data.tenants.size()", equalTo(2))
            .body("data.tenants.tenant_id", hasItem(secondTenantId.toString()))
            .extract().response();

        assertNull(challenge.path("data.access_token"));

        postJson(SELECT_TENANT_PATH, Map.of(
                "pre_auth_token", challenge.path("data.pre_auth_token"),
                "tenant_id", secondTenantId.toString()))
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS))
            .body("data.access_token", not(emptyOrNullString()))
            .body("data.refresh_token", not(emptyOrNullString()))
            .body("data.user.tenant_id", equalTo(secondTenantId.toString()));
    }

    @Test
    @DisplayName("BUG-44 (API): backup code chỉ dùng được một lần khi verify-login 2FA")
    public void testBackupCodeSingleUse() {
        String email = "api.backupcode@example.com";
        registerAndVerify(email);

        Response login = loginSuccess(email);
        String accessToken = login.path("data.access_token");
        String sessionId = login.path("data.session_id");

        Response setup = given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
        .when()
            .post(SETUP_2FA_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.ACCOUNT_2FA_SETUP_SUCCESS))
            .extract().response();

        String secretKey = setup.path("data.secret_key");

        Response enabled = given().contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
            .body(Map.of("code", totpService.generateCurrentCode(secretKey)))
        .when()
            .post(ENABLE_2FA_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.ACCOUNT_2FA_ENABLED_SUCCESS))
            .body("data.backup_codes.size()", equalTo(8))
            .extract().response();

        List<String> backupCodes = enabled.path("data.backup_codes");
        String backupCode = backupCodes.get(0);

        Response firstChallenge = login(email, PASSWORD)
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_2FA_REQUIRED))
            .extract().response();

        postJson(VERIFY_2FA_PATH, Map.of(
                "pre_auth_token", firstChallenge.path("data.pre_auth_token"),
                "code", backupCode))
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS))
            .body("data.access_token", not(emptyOrNullString()));

        Response secondChallenge = login(email, PASSWORD)
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_2FA_REQUIRED))
            .extract().response();

        postJson(VERIFY_2FA_PATH, Map.of(
                "pre_auth_token", secondChallenge.path("data.pre_auth_token"),
                "code", backupCode))
            .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.AUTH_2FA_CODE_INVALID));
    }

    @Test
    @DisplayName("BUG-44 (API): disable-2fa với sai mật khẩu hoặc sai code trả 401 ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE")
    public void testDisable2FaRejectsInvalidPasswordOrCode() {
        String email = "api.disable2fa@example.com";
        registerAndVerify(email);

        Response login = loginSuccess(email);
        String accessToken = login.path("data.access_token");
        String sessionId = login.path("data.session_id");

        Response setup = given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
        .when()
            .post(SETUP_2FA_PATH)
        .then()
            .statusCode(200)
            .extract().response();

        String secretKey = setup.path("data.secret_key");
        String validTotpCode = totpService.generateCurrentCode(secretKey);

        given().contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
            .body(Map.of("code", validTotpCode))
        .when()
            .post(ENABLE_2FA_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.ACCOUNT_2FA_ENABLED_SUCCESS));

        // Sai code 2FA (mật khẩu đúng)
        given().contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
            .body(Map.of("current_password", PASSWORD, "code", "000000"))
        .when()
            .post(DISABLE_2FA_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE));

        // Sai mật khẩu (code 2FA đúng)
        given().contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
            .body(Map.of("current_password", "WrongPassword@123", "code", totpService.generateCurrentCode(secretKey)))
        .when()
            .post(DISABLE_2FA_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE));
    }

    @Test
    @DisplayName("BUG-44 (API): change-password với logout_other_devices=true thu hồi session khác, giữ session hiện tại")
    public void testChangePasswordRevokesOtherSessions() {
        String email = "api.changepass@example.com";
        registerAndVerify(email);

        Response firstLogin = loginSuccess(email);
        Response secondLogin = loginSuccess(email);

        String firstToken = firstLogin.path("data.access_token");
        String firstSession = firstLogin.path("data.session_id");
        String secondToken = secondLogin.path("data.access_token");
        String secondSession = secondLogin.path("data.session_id");

        assertNotEquals(firstSession, secondSession);

        given().contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + firstToken)
            .header("X-Session-Id", firstSession)
            .body(Map.of(
                "current_password", PASSWORD,
                "new_password", "ChangedP@ssw0rd456",
                "logout_other_devices", true))
        .when()
            .post(CHANGE_PASSWORD_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.ACCOUNT_PASSWORD_CHANGE_SUCCESS));

        // Session thứ hai đã bị thu hồi
        given()
            .header("Authorization", "Bearer " + secondToken)
            .header("X-Session-Id", secondSession)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));

        // Session hiện tại vẫn hoạt động
        given()
            .header("Authorization", "Bearer " + firstToken)
            .header("X-Session-Id", firstSession)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.ACCOUNT_PROFILE_FETCH_SUCCESS));

        // Mật khẩu mới đăng nhập được
        login(email, "ChangedP@ssw0rd456")
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS));
    }

    @Test
    @DisplayName("BUG-30 (API): check-slug trả AVAILABLE/DUPLICATE/VALIDATION_FAILED theo hợp đồng")
    public void testCheckSlugEndpoint() {
        given()
            .queryParam("slug", "brand-new-workspace")
        .when()
            .get(CHECK_SLUG_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_TENANT_SLUG_AVAILABLE))
            .body("data.slug", equalTo("brand-new-workspace"))
            .body("data.available", equalTo(true));

        Map<String, Object> registerBody = new HashMap<>();
        registerBody.put("admin", Map.of(
            "full_name", "Chủ Doanh Nghiệp",
            "email", "api.slug.owner@example.com",
            "password", "OwnerP@ssw0rd123"));
        registerBody.put("tenant", Map.of(
            "name", "Công Ty Kiểm Tra Slug",
            "slug", "taken-workspace-01"));

        postJson(BUSINESS_REGISTER_PATH, registerBody)
            .then()
            .statusCode(201)
            .body("code", equalTo(ErrorCode.AUTH_BUSINESS_REGISTER_SUCCESS));

        // Duplicate (đồng thời kiểm tra chuẩn hóa uppercase -> lowercase)
        given()
            .queryParam("slug", "Taken-Workspace-01")
        .when()
            .get(CHECK_SLUG_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_TENANT_SLUG_DUPLICATE))
            .body("data.slug", equalTo("taken-workspace-01"))
            .body("data.available", equalTo(false));

        // Invalid format
        given()
            .queryParam("slug", "-invalid-slug")
        .when()
            .get(CHECK_SLUG_PATH)
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.VALIDATION_FAILED))
            .body("params.field", equalTo("slug"));

        // Reserved slug
        given()
            .queryParam("slug", "admin")
        .when()
            .get(CHECK_SLUG_PATH)
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.VALIDATION_FAILED))
            .body("params.field", equalTo("slug"));
    }

    @Test
    @DisplayName("TC-16 (API): Lỗi client 4xx giữ đúng HTTP status và envelope code (415 Unsupported Media Type)")
    public void testClientErrorsKeepStatusAndEnvelope() {
        given()
            .body("{ invalid json without content type }")
        .when()
            .post("/api/v1/auth/login")
        .then()
            .statusCode(415)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNSUPPORTED_MEDIA_TYPE));
    }

    @Test
    @DisplayName("TC-11 (API): Refresh cấp Access Token mới, Logout blacklist token và hủy session")
    public void testRefreshAndLogoutBlacklist() {
        String email = "api.refresh@example.com";
        registerAndVerify(email);

        Response login = loginSuccess(email);
        String accessToken = login.path("data.access_token");
        String refreshToken = login.path("data.refresh_token");
        String sessionId = login.path("data.session_id");

        Response refreshed = postJson(REFRESH_PATH, Map.of("refresh_token", refreshToken))
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_TOKEN_REFRESH_SUCCESS))
            .body("data.access_token", not(emptyOrNullString()))
            .body("data.expires_in", equalTo(900))
            .extract().response();

        String refreshedAccessToken = refreshed.path("data.access_token");
        assertNotEquals(accessToken, refreshedAccessToken);

        given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
        .when()
            .post(LOGOUT_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_LOGOUT_SUCCESS));

        given()
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));

        postJson(REFRESH_PATH, Map.of("refresh_token", refreshToken))
            .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED));
    }

    @Test
    @DisplayName("TC-05 + TC-10 (API): 2FA verify-login sai 3 lần trả AUTH_2FA_ATTEMPTS_EXCEEDED và hủy pre-auth")
    public void testTwoFactorLoginAttemptLockout() {
        String email = "api.2fa@example.com";
        registerAndVerify(email);

        Response login = loginSuccess(email);
        String accessToken = login.path("data.access_token");
        String sessionId = login.path("data.session_id");

        Response setup = given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
        .when()
            .post(SETUP_2FA_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.ACCOUNT_2FA_SETUP_SUCCESS))
            .body("data.secret_key", not(emptyOrNullString()))
            .extract().response();

        String secretKey = setup.path("data.secret_key");
        String validCode = totpService.generateCurrentCode(secretKey);

        given().contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Session-Id", sessionId)
            .body(Map.of("code", validCode))
        .when()
            .post(ENABLE_2FA_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.ACCOUNT_2FA_ENABLED_SUCCESS))
            .body("data.is_enabled", equalTo(true));

        Response challenge = login(email, PASSWORD)
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_2FA_REQUIRED))
            .body("data.requires_2fa", equalTo(true))
            .body("data.pre_auth_token", not(emptyOrNullString()))
            .extract().response();

        String preAuthToken = challenge.path("data.pre_auth_token");
        assertNull(challenge.path("data.access_token"));

        for (int attempt = 1; attempt <= 2; attempt++) {
            postJson(VERIFY_2FA_PATH, Map.of("pre_auth_token", preAuthToken, "code", "000000"))
                .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("code", equalTo(ErrorCode.AUTH_2FA_CODE_INVALID));
        }

        postJson(VERIFY_2FA_PATH, Map.of("pre_auth_token", preAuthToken, "code", "000000"))
            .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.AUTH_2FA_ATTEMPTS_EXCEEDED));

        postJson(VERIFY_2FA_PATH, Map.of("pre_auth_token", preAuthToken, "code", "000000"))
            .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("TC-13 (API): Resend verification bị giới hạn 60s trả 429 kèm params.retry_after")
    public void testResendVerificationRateLimit() {
        String email = "api.resend@example.com";
        registerOnly(email);

        postJson(RESEND_PATH, Map.of("email", email))
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_VERIFICATION_EMAIL_RESENT));

        postJson(RESEND_PATH, Map.of("email", email))
            .then()
            .statusCode(429)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.AUTH_OTP_RESEND_TOO_SOON))
            .body("params.retry_after", greaterThan(0));
    }
}
