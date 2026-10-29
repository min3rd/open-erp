package com.vn9melody.openerp.plugins.inappnotification;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class HealthTest {

    @Test
    public void healthEndpointResponds() {
        given()
                .when().get("/q/health/ready")
                .then().statusCode(200);
    }
}
