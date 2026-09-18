package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.iam.model.PasswordResetToken;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.iam.model.UserTwoFactor;
import com.vn9melody.openerp.modules.iam.service.EmailNotificationService;
import com.vn9melody.openerp.support.RedisTestSupport;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

@QuarkusTest
public class AccountTenantIsolationApiTest {

    private static final String REGISTER_PATH = "/api/v1/auth/register/personal";
    private static final String VERIFY_EMAIL_PATH = "/api/v1/auth/verify-email";
    private static final String LOGIN_PATH = "/api/v1/auth/login";
    private static final String PROFILE_PATH = "/api/v1/account/profile";
    private static final String SESSIONS_PATH = "/api/v1/account/sessions";

    private static final String PASSWORD = "IsoP@ssw0rd123";

    private static final class UserSession {
        String userId;
        String tenantId;
        String email;
        String accessToken;
        String refreshToken;
        String sessionId;
    }

    @Inject
    JwtTokenService jwtTokenService;

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

    private Response postJson(String path, Map<String, Object> body) {
        return given().contentType(ContentType.JSON).body(body).when().post(path);
    }

    private String captureOtp(String email) {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(emailNotificationService)
            .sendVerificationOtp(ArgumentMatchers.eq(email), otpCaptor.capture());
        return otpCaptor.getValue();
    }

    private UserSession createVerifiedUser(String email, String fullName, String phone) {
        Map<String, Object> registerBody = new HashMap<>();
        registerBody.put("email", email);
        registerBody.put("password", PASSWORD);
        registerBody.put("full_name", fullName);
        registerBody.put("phone", phone);

        Response registered = postJson(REGISTER_PATH, registerBody)
            .then()
            .statusCode(201)
            .body("code", equalTo(ErrorCode.AUTH_REGISTER_SUCCESS))
            .extract().response();

        String otp = captureOtp(email);
        postJson(VERIFY_EMAIL_PATH, Map.of("email", email, "otp_code", otp))
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_EMAIL_VERIFIED_SUCCESS));

        Response login = postJson(LOGIN_PATH, Map.of("email", email, "password", PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS))
            .extract().response();

        UserSession session = new UserSession();
        session.userId = registered.path("data.user_id");
        session.tenantId = login.path("data.user.tenant_id");
        session.email = email;
        session.accessToken = login.path("data.access_token");
        session.refreshToken = login.path("data.refresh_token");
        session.sessionId = login.path("data.session_id");
        return session;
    }

    @Test
    @DisplayName("TC-14 (API): Cô lập dữ liệu người dùng: A không thấy/thao tác được session và hồ sơ của B")
    public void testCrossUserDataIsolation() {
        UserSession userA = createVerifiedUser("iso.user.a@example.com", "Người Dùng A", "0901111111");
        UserSession userB = createVerifiedUser("iso.user.b@example.com", "Người Dùng B", "0902222222");

        assertNotEquals(userA.userId, userB.userId);
        assertNotEquals(userA.tenantId, userB.tenantId);
        assertNotEquals(userA.sessionId, userB.sessionId);

        given()
            .header("Authorization", "Bearer " + userA.accessToken)
            .header("X-Session-Id", userA.sessionId)
        .when()
            .get(SESSIONS_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.ACCOUNT_SESSIONS_FETCH_SUCCESS))
            .body("data.size()", equalTo(1))
            .body("data.session_id[0]", equalTo(userA.sessionId))
            .body("data.session_id", not(hasItem(userB.sessionId)));

        given()
            .header("Authorization", "Bearer " + userA.accessToken)
            .header("X-Session-Id", userA.sessionId)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.ACCOUNT_PROFILE_FETCH_SUCCESS))
            .body("data.user_id", equalTo(userA.userId))
            .body("data.email", equalTo(userA.email))
            .body("data.email", not(equalTo(userB.email)))
            .body("data.phone", equalTo("0901111111"))
            .body("data.phone", not(equalTo("0902222222")));

        given()
            .header("Authorization", "Bearer " + userA.accessToken)
            .header("X-Session-Id", userA.sessionId)
        .when()
            .delete(SESSIONS_PATH + "/" + UUID.randomUUID())
        .then()
            .statusCode(404)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.ACCOUNT_SESSION_NOT_FOUND));
    }

    @Test
    @DisplayName("TC-15 (API): Token hợp lệ nhưng gắn session của người khác bị từ chối 401")
    public void testForeignSessionBindingRejected() {
        UserSession userA = createVerifiedUser("iso.bound.a@example.com", "Người Dùng A2", "0903333333");
        UserSession userB = createVerifiedUser("iso.bound.b@example.com", "Người Dùng B2", "0904444444");

        String forgedToken = jwtTokenService.generateAccessToken(
            UUID.fromString(userA.userId),
            userA.email,
            UUID.fromString(userA.tenantId),
            "TENANT_ADMIN",
            userB.sessionId);

        given()
            .header("Authorization", "Bearer " + forgedToken)
            .header("X-Session-Id", userB.sessionId)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));

        given()
            .header("Authorization", "Bearer " + userB.accessToken)
            .header("X-Session-Id", userB.sessionId)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(200)
            .body("data.email", equalTo(userB.email));
    }

    @Test
    @DisplayName("TC-14b (API): A xóa session của B phải bị từ chối 404 ACCOUNT_SESSION_NOT_FOUND")
    public void testCrossUserSessionRevocationRejected() {
        UserSession userA = createVerifiedUser("iso.revoke.a@example.com", "Người Dùng A3", "0905555555");
        UserSession userB = createVerifiedUser("iso.revoke.b@example.com", "Người Dùng B3", "0906666666");

        given()
            .header("Authorization", "Bearer " + userA.accessToken)
            .header("X-Session-Id", userA.sessionId)
        .when()
            .delete(SESSIONS_PATH + "/" + userB.sessionId)
        .then()
            .statusCode(404)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.ACCOUNT_SESSION_NOT_FOUND));
    }
}
