package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.iam.service.EmailNotificationService;
import com.vn9melody.openerp.support.RedisTestSupport;
import com.vn9melody.openerp.support.TestDbCleanup;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

/**
 * QA verification for TASK-354 (avatar upload): upload → serve → profile, tenant
 * prefix isolation, and trust-boundary validation (extension / unknown ref).
 * Runs on real PostgreSQL + Redis with local object storage.
 */
@QuarkusTest
public class AccountAvatarApiTest {

    private static final String REGISTER_PATH = "/api/v1/auth/register/personal";
    private static final String VERIFY_EMAIL_PATH = "/api/v1/auth/verify-email";
    private static final String LOGIN_PATH = "/api/v1/auth/login";
    private static final String PROFILE_PATH = "/api/v1/account/profile";
    private static final String AVATAR_PATH = "/api/v1/account/avatar";
    private static final String PASSWORD = "Av@t3rP@ssw0rd123";

    private static final byte[] PNG_BYTES = {
        (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4, 5, 6, 7, 8
    };

    private static final class UserSession {
        String userId;
        String tenantId;
        String email;
        String accessToken;
        String sessionId;
    }

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    @InjectMock
    EmailNotificationService emailNotificationService;

    @BeforeEach
    @Transactional
    public void setup() {
        TestDbCleanup.cleanup(entityManager);
        RedisTestSupport.clearAll(redis);
    }

    @Test
    @DisplayName("TASK-354: upload avatar → serve tại URL ref (công khai) → lưu vào hồ sơ, ref có tiền tố tenant")
    public void testUploadServeAndProfile() {
        UserSession user = createVerifiedUser("avatar.serve@example.com");

        Response upload = given()
                .header("Authorization", "Bearer " + user.accessToken)
                .header("X-Session-Id", user.sessionId)
                .multiPart("file", "me.png", PNG_BYTES, "image/png")
            .when().post(AVATAR_PATH)
            .then()
                .statusCode(200)
                .body("code", equalTo(ErrorCode.ACCOUNT_AVATAR_UPLOAD_SUCCESS))
                .body("data.avatar_url", startsWith(AVATAR_PATH + "?ref="))
                .extract().response();

        String avatarUrl = upload.path("data.avatar_url");
        String ref = URLDecoder.decode(
                avatarUrl.substring(avatarUrl.indexOf("ref=") + 4), StandardCharsets.UTF_8);
        assertTrue(ref.startsWith("tenant-files/" + user.tenantId + "/avatars/"),
                "avatar ref must be tenant-scoped, was: " + ref);

        byte[] served = given()
                .queryParam("ref", ref)
            .when().get(AVATAR_PATH)
            .then()
                .statusCode(200)
                .header("Content-Type", containsString("image/png"))
                .extract().asByteArray();
        assertArrayEquals(PNG_BYTES, served, "served bytes must match the uploaded image");

        given()
                .header("Authorization", "Bearer " + user.accessToken)
                .header("X-Session-Id", user.sessionId)
            .when().get(PROFILE_PATH)
            .then()
                .statusCode(200)
                .body("data.avatar_url", equalTo(avatarUrl));
    }

    @Test
    @DisplayName("TASK-354: từ chối tệp không phải ảnh (400) và định dạng ảnh không hỗ trợ (400)")
    public void testRejectsNonImage() {
        UserSession user = createVerifiedUser("avatar.invalid@example.com");

        given()
                .header("Authorization", "Bearer " + user.accessToken)
                .header("X-Session-Id", user.sessionId)
                .multiPart("file", "notes.txt", "hello".getBytes(StandardCharsets.UTF_8), "text/plain")
            .when().post(AVATAR_PATH)
            .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("code", equalTo(ErrorCode.ACCOUNT_AVATAR_INVALID_TYPE));

        given()
                .header("Authorization", "Bearer " + user.accessToken)
                .header("X-Session-Id", user.sessionId)
                .multiPart("file", "bitmap.bmp", PNG_BYTES, "image/bmp")
            .when().post(AVATAR_PATH)
            .then()
                .statusCode(400)
                .body("code", equalTo(ErrorCode.ACCOUNT_AVATAR_INVALID_TYPE));
    }

    @Test
    @DisplayName("TASK-354: ref thiếu → 400, ref không tồn tại → 404")
    public void testBadRefs() {
        given().when().get(AVATAR_PATH)
            .then()
                .statusCode(400)
                .body("code", equalTo(ErrorCode.ACCOUNT_AVATAR_NOT_FOUND));

        given().queryParam("ref", "tenant-files/00000000-0000-0000-0000-000000000000/avatars/x/y.png")
            .when().get(AVATAR_PATH)
            .then()
                .statusCode(404)
                .body("code", equalTo(ErrorCode.ACCOUNT_AVATAR_NOT_FOUND));
    }

    private UserSession createVerifiedUser(String email) {
        Map<String, Object> register = new HashMap<>();
        register.put("email", email);
        register.put("password", PASSWORD);
        register.put("full_name", "Avatar QA");
        register.put("phone", "0900000099");

        Response registered = given().contentType(ContentType.JSON).body(register)
            .when().post(REGISTER_PATH)
            .then().statusCode(201).extract().response();

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(emailNotificationService)
            .sendVerificationOtp(ArgumentMatchers.eq(email), otpCaptor.capture());

        given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "otp_code", otpCaptor.getValue()))
            .when().post(VERIFY_EMAIL_PATH)
            .then().statusCode(200);

        Response login = given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", PASSWORD))
            .when().post(LOGIN_PATH)
            .then().statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS))
            .extract().response();

        UserSession session = new UserSession();
        session.userId = registered.path("data.user_id");
        session.tenantId = login.path("data.user.tenant_id");
        session.email = email;
        session.accessToken = login.path("data.access_token");
        session.sessionId = login.path("data.session_id");
        return session;
    }
}
