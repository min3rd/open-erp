package com.vn9melody.openerp.plugins.office.service;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test for the MinIO / S3 path of OfficeBlobStore.
 * Runs only when MinIO is reachable (or OFFICE_IT_MINIO_ENDPOINT is provided).
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OfficeBlobStoreMinioTest {

    private static final DateTimeFormatter AMZ_DATE = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final DateTimeFormatter DATE_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final String ENDPOINT = env("OFFICE_IT_MINIO_ENDPOINT", "http://localhost:9000");
    private static final String ACCESS_KEY = env("OFFICE_IT_MINIO_ACCESS_KEY", "openerp_minio_admin");
    private static final String SECRET_KEY = env("OFFICE_IT_MINIO_SECRET_KEY", "openerp_minio_password");
    private static final String BUCKET = env("OFFICE_IT_MINIO_BUCKET", "tenant-files");
    private static final String REGION = env("OFFICE_IT_MINIO_REGION", "us-east-1");

    private final HttpClient http = HttpClient.newHttpClient();
    private OfficeBlobStore store;
    private final UUID tenantId = UUID.randomUUID();
    private final UUID documentId = UUID.randomUUID();

    @BeforeAll
    void setUp() throws Exception {
        try {
            HttpResponse<Void> health = http.send(HttpRequest.newBuilder(
                            URI.create(ENDPOINT + "/minio/health/live")).GET().build(),
                    HttpResponse.BodyHandlers.discarding());
            Assumptions.assumeTrue(health.statusCode() == 200, "MinIO health check failed");
        } catch (Exception unavailable) {
            Assumptions.abort("MinIO is not available at " + ENDPOINT + ": " + unavailable.getMessage());
        }
        int create = signed("PUT", "/" + BUCKET, new byte[0]).statusCode();
        Assumptions.assumeTrue(create < 300 || create == 409,
                "Cannot create/verify MinIO bucket: HTTP " + create);

        store = new OfficeBlobStore();
        store.minioEndpoint = ENDPOINT;
        store.minioAccessKey = ACCESS_KEY;
        store.minioSecretKey = SECRET_KEY;
        store.minioBucket = BUCKET;
        store.minioRegion = REGION;
    }

    @AfterAll
    void tearDown() throws Exception {
        if (store == null) return;
        signed("DELETE", "/" + BUCKET + "/" + encodePath(store.keyFor(tenantId, documentId, 1, "report.docx")), new byte[0]);
        signed("DELETE", "/" + BUCKET + "/" + encodePath(store.keyFor(tenantId, documentId, 2, "report.docx")), new byte[0]);
    }

    @Test
    void putGetRoundTripAgainstMinio() throws Exception {
        byte[] first = "PK\u0003\u0004minio-first".getBytes(StandardCharsets.UTF_8);
        OfficeBlobStore.StoredBinary stored = store.put(tenantId, documentId, 1, "report.docx", first);

        assertEquals(tenantId + "/office/" + documentId + "/v1_report.docx", stored.storageKey());
        assertEquals(first.length, stored.sizeBytes());
        assertEquals(sha256(first), stored.checksumSha256());
        assertArrayEquals(first, store.get(stored.storageKey()));

        byte[] second = "PK\u0003\u0004minio-second-version".getBytes(StandardCharsets.UTF_8);
        OfficeBlobStore.StoredBinary overwritten = store.put(tenantId, documentId, 2, "report.docx", second);
        assertNotEquals(stored.storageKey(), overwritten.storageKey());
        assertEquals(sha256(second), overwritten.checksumSha256());
        assertArrayEquals(second, store.get(overwritten.storageKey()));
        assertArrayEquals(first, store.get(stored.storageKey()));
        assertTrue(store.get(stored.storageKey()).length > 0);
        System.out.println("MINIO_IT_OK key=" + stored.storageKey()
                + " bytes=" + stored.sizeBytes()
                + " checksum=" + stored.checksumSha256());
    }

    private HttpResponse<byte[]> signed(String method, String path, byte[] body) throws Exception {
        URI endpoint = URI.create(ENDPOINT);
        String host = endpoint.getPort() > 0 ? endpoint.getHost() + ":" + endpoint.getPort() : endpoint.getHost();
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        String amzDate = now.format(AMZ_DATE);
        String dateStamp = now.format(DATE_STAMP);
        String payloadHash = sha256(body);
        String canonicalHeaders = "host:" + host + "\n"
                + "x-amz-content-sha256:" + payloadHash + "\n"
                + "x-amz-date:" + amzDate + "\n";
        String signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        String canonicalRequest = method + "\n" + path + "\n\n" + canonicalHeaders + "\n"
                + signedHeaders + "\n" + payloadHash;
        String scope = dateStamp + "/" + REGION + "/s3/aws4_request";
        String stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n"
                + sha256(canonicalRequest.getBytes(StandardCharsets.UTF_8));
        byte[] signingKey = hmac(hmac(hmac(hmac(
                ("AWS4" + SECRET_KEY).getBytes(StandardCharsets.UTF_8), dateStamp), REGION), "s3"), "aws4_request");
        String signature = HexFormat.of().formatHex(hmac(signingKey, stringToSign));
        String authorization = "AWS4-HMAC-SHA256 Credential=" + ACCESS_KEY + "/" + scope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(endpoint.getScheme() + "://" + host + path))
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", amzDate)
                .header("Authorization", authorization);
        if ("PUT".equals(method)) builder.PUT(HttpRequest.BodyPublishers.ofByteArray(body));
        else if ("DELETE".equals(method)) builder.DELETE();
        else builder.GET();
        return http.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
    }

    private static byte[] hmac(byte[] key, String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String sha256(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    private static String encodePath(String key) {
        StringBuilder encoded = new StringBuilder();
        for (String segment : key.split("/")) {
            if (encoded.length() > 0) encoded.append('/');
            encoded.append(URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"));
        }
        return encoded.toString();
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}
