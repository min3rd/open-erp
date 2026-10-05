package com.vn9melody.openerp.core.storage;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import io.quarkus.arc.properties.IfBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * MinIO (S3-compatible) {@link ObjectStorage} using AWS Signature V4 (no SDK
 * dependency). Primary system storage per the Confirmation Gate; enabled with
 * {@code openerp.storage.provider=minio}.
 */
@ApplicationScoped
@IfBuildProperty(name = "openerp.storage.provider", stringValue = "minio")
public class MinioObjectStorage implements ObjectStorage {

    private static final DateTimeFormatter AMZ_DATE =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    @ConfigProperty(name = "openerp.storage.minio.endpoint", defaultValue = "http://localhost:9000")
    String endpoint;

    @ConfigProperty(name = "openerp.storage.minio.access-key", defaultValue = "openerp")
    String accessKey;

    @ConfigProperty(name = "openerp.storage.minio.secret-key", defaultValue = "openerp_minio_secret")
    String secretKey;

    @ConfigProperty(name = "openerp.storage.minio.region", defaultValue = "us-east-1")
    String region;

    @Override
    public StoredObject put(String bucket, String key, InputStream content) {
        try {
            byte[] payload = content.readAllBytes();
            String checksum = sha256Hex(payload);
            putObject(bucket, key, payload);
            return new StoredObject(bucket, key, checksum, payload.length);
        } catch (IOException e) {
            throw new ApiException(500, ErrorCode.STORAGE_WRITE_FAILED,
                    "Cannot store object in MinIO: " + e.getMessage());
        }
    }

    @Override
    public InputStream get(String bucket, String key) {
        if (bucket == null || key == null) {
            throw new ApiException(400, ErrorCode.STORAGE_INVALID_REF, "bucket and key are required");
        }
        String canonicalUri = "/" + bucket + "/" + urlEncodePath(key);
        String host = URI.create(endpoint).getHost();
        String amzDate = AMZ_DATE.format(Instant.now());
        String dateStamp = amzDate.substring(0, 8);
        String payloadHash = sha256Hex(new byte[0]);
        String authorization = authorization("GET", canonicalUri, host, amzDate, dateStamp, payloadHash);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint + canonicalUri))
                .header("x-amz-date", amzDate)
                .header("x-amz-content-sha256", payloadHash)
                .header("Authorization", authorization)
                .GET()
                .build();
        try {
            HttpResponse<InputStream> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() >= 300) {
                throw new ApiException(404, ErrorCode.STORAGE_OBJECT_NOT_FOUND,
                        "MinIO returned " + response.statusCode());
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException(502, ErrorCode.STORAGE_OBJECT_NOT_FOUND,
                    "MinIO request failed: " + e.getMessage());
        }
    }

    private void putObject(String bucket, String key, byte[] payload) {
        String canonicalUri = "/" + bucket + "/" + urlEncodePath(key);
        String host = URI.create(endpoint).getHost();
        String amzDate = AMZ_DATE.format(Instant.now());
        String dateStamp = amzDate.substring(0, 8);
        String payloadHash = sha256Hex(payload);
        String authorization = authorization("PUT", canonicalUri, host, amzDate, dateStamp, payloadHash);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint + canonicalUri))
                .header("x-amz-date", amzDate)
                .header("x-amz-content-sha256", payloadHash)
                .header("Authorization", authorization)
                .header("Content-Type", "application/octet-stream")
                .PUT(HttpRequest.BodyPublishers.ofByteArray(payload))
                .build();
        try {
            HttpResponse<Void> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 300) {
                throw new ApiException(500, ErrorCode.STORAGE_WRITE_FAILED,
                        "MinIO upload failed with status " + response.statusCode());
            }
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException(502, ErrorCode.STORAGE_WRITE_FAILED,
                    "MinIO upload failed: " + e.getMessage());
        }
    }

    private String authorization(String method, String canonicalUri, String host, String amzDate,
                                 String dateStamp, String payloadHash) {
        String canonicalHeaders = "host:" + host + "\n"
                + "x-amz-content-sha256:" + payloadHash + "\n"
                + "x-amz-date:" + amzDate + "\n";
        String signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        String canonicalRequest = method + "\n" + canonicalUri + "\n\n" + canonicalHeaders + "\n"
                + signedHeaders + "\n" + payloadHash;
        String scope = dateStamp + "/" + region + "/s3/aws4_request";
        String stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n"
                + sha256Hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));
        byte[] signingKey = hmacChain(("AWS4" + secretKey).getBytes(StandardCharsets.UTF_8),
                dateStamp, region, "s3", "aws4_request");
        String signature = HexFormat.of().formatHex(hmac(signingKey, stringToSign.getBytes(StandardCharsets.UTF_8)));
        return "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + scope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;
    }

    private byte[] hmacChain(byte[] key, String... values) {
        byte[] current = key;
        for (String value : values) {
            current = hmac(current, value.getBytes(StandardCharsets.UTF_8));
        }
        return current;
    }

    private byte[] hmac(byte[] key, byte[] value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(value);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }

    private String sha256Hex(byte[] payload) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 failure", e);
        }
    }

    private String urlEncodePath(String path) {
        StringBuilder encoded = new StringBuilder();
        for (String segment : path.split("/")) {
            if (encoded.length() > 0) {
                encoded.append('/');
            }
            encoded.append(java.net.URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"));
        }
        return encoded.toString();
    }
}
