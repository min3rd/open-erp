package com.vn9melody.openerp.plugins.office.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Tenant-scoped blob storage for office binaries. Uses local disk by default and
 * MinIO (S3 path-style + SigV4) when {@code office.document.minio-endpoint} is set.
 */
@ApplicationScoped
public class OfficeBlobStore {

    private static final DateTimeFormatter AMZ_DATE = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final DateTimeFormatter DATE_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd");

    @ConfigProperty(name = "office.document.storage-dir", defaultValue = "")
    String storageDir;

    @ConfigProperty(name = "office.document.minio-endpoint", defaultValue = "")
    String minioEndpoint;

    @ConfigProperty(name = "office.document.minio-access-key", defaultValue = "openerp")
    String minioAccessKey;

    @ConfigProperty(name = "office.document.minio-secret-key", defaultValue = "openerp_minio_secret")
    String minioSecretKey;

    @ConfigProperty(name = "office.document.minio-bucket", defaultValue = "tenant-files")
    String minioBucket;

    @ConfigProperty(name = "office.document.minio-region", defaultValue = "us-east-1")
    String minioRegion;

    public record StoredBinary(String storageKey, long sizeBytes, String checksumSha256) {}

    public StoredBinary put(UUID tenantId, UUID documentId, int version, String fileName, byte[] data) {
        String key = keyFor(tenantId, documentId, version, fileName);
        String checksum = sha256Hex(data);
        try {
            if (minioEnabled()) {
                s3Request("PUT", key, data);
            } else {
                Path target = localPath(key);
                Files.createDirectories(target.getParent());
                Files.write(target, data);
            }
        } catch (IOException e) {
            throw new ApiException(500, "OFFICE_BLOB_WRITE_FAILED",
                    "Cannot store office binary", java.util.Map.of("document_id", documentId.toString()));
        }
        return new StoredBinary(key, data.length, checksum);
    }

    public byte[] get(String storageKey) {
        try {
            if (minioEnabled()) {
                return s3Request("GET", storageKey, new byte[0]);
            }
            Path source = localPath(storageKey);
            if (!Files.isRegularFile(source)) {
                throw new ApiException(404, "OFFICE_BLOB_NOT_FOUND", "Office binary not found",
                        java.util.Map.of("storage_key", storageKey));
            }
            return Files.readAllBytes(source);
        } catch (IOException e) {
            throw new ApiException(500, "OFFICE_BLOB_READ_FAILED",
                    "Cannot read office binary", java.util.Map.of("storage_key", storageKey));
        }
    }

    public String keyFor(UUID tenantId, UUID documentId, int version, String fileName) {
        String safeName = fileName == null || fileName.isBlank() ? "document.bin" : fileName;
        safeName = safeName.replaceAll("[^A-Za-z0-9._-]", "_");
        if (safeName.contains("..")) safeName = "document.bin";
        return tenantId + "/office/" + documentId + "/v" + version + "_" + safeName;
    }

    private boolean minioEnabled() {
        return minioEndpoint != null && !minioEndpoint.isBlank();
    }

    private Path localPath(String key) {
        String base = storageDir == null || storageDir.isBlank()
                ? Path.of(System.getProperty("java.io.tmpdir"), "open-erp-office").toString()
                : storageDir;
        Path root = Path.of(base).toAbsolutePath().normalize();
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new ApiException(400, "OFFICE_BLOB_UNSAFE_PATH", "Unsafe storage key",
                    java.util.Map.of("storage_key", key));
        }
        return target;
    }

    private byte[] s3Request(String method, String key, byte[] body) throws IOException {
        URI endpoint = URI.create(minioEndpoint);
        String host = endpoint.getPort() > 0 ? endpoint.getHost() + ":" + endpoint.getPort() : endpoint.getHost();
        String path = "/" + minioBucket + "/" + encodePath(key);
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        String amzDate = now.format(AMZ_DATE);
        String dateStamp = now.format(DATE_STAMP);
        String payloadHash = sha256Hex(body);

        String canonicalHeaders = "host:" + host + "\n"
                + "x-amz-content-sha256:" + payloadHash + "\n"
                + "x-amz-date:" + amzDate + "\n";
        String signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        String canonicalRequest = method + "\n" + path + "\n\n" + canonicalHeaders + "\n"
                + signedHeaders + "\n" + payloadHash;
        String scope = dateStamp + "/" + minioRegion + "/s3/aws4_request";
        String stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n" + sha256Hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));
        byte[] signingKey = signingKey(dateStamp);
        String signature = HexFormat.of().formatHex(hmac(signingKey, stringToSign));
        String authorization = "AWS4-HMAC-SHA256 Credential=" + minioAccessKey + "/" + scope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

        URI uri = URI.create(endpoint.getScheme() + "://" + host + path);
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", amzDate)
                .header("Authorization", authorization);
        if ("PUT".equals(method)) {
            builder.PUT(HttpRequest.BodyPublishers.ofByteArray(body));
        } else {
            builder.GET();
        }
        HttpResponse<byte[]> response;
        try {
            response = HttpClient.newHttpClient()
                    .send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Object storage request interrupted", e);
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ApiException(500, "OFFICE_BLOB_STORAGE_FAILED",
                    "Object storage returned " + response.statusCode(),
                    java.util.Map.of("storage_key", key));
        }
        return response.body();
    }

    private byte[] signingKey(String dateStamp) {
        byte[] date = hmac(("AWS4" + minioSecretKey).getBytes(StandardCharsets.UTF_8), dateStamp);
        byte[] region = hmac(date, minioRegion);
        byte[] service = hmac(region, "s3");
        return hmac(service, "aws4_request");
    }

    private static byte[] hmac(byte[] key, String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 failure", e);
        }
    }

    private static String encodePath(String key) {
        String[] segments = key.split("/");
        StringBuilder encoded = new StringBuilder();
        for (String segment : segments) {
            if (encoded.length() > 0) encoded.append('/');
            encoded.append(URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"));
        }
        return encoded.toString();
    }
}
