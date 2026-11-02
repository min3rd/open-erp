package com.vn9melody.openerp.plugins.form.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugins.form.model.FormDefinition;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * File storage for form uploads (AC-F07): local disk + ClamAV INSTREAM scan +
 * HMAC signed download URLs, mirroring the Sprint 07 employee pattern so the
 * Core signed passthrough works without changes (path marker /signed-documents/).
 */
@ApplicationScoped
public class FormFileService {

    @ConfigProperty(name = "form.files.storage-dir", defaultValue = "data/form-files")
    String storageDir;

    @ConfigProperty(name = "form.files.signed-url.secret", defaultValue = "openerp-form-dev-signed-url-secret")
    String signingSecret;

    @ConfigProperty(name = "form.files.signed-url.ttl-seconds", defaultValue = "300")
    long ttlSeconds;

    @ConfigProperty(name = "form.files.max-bytes", defaultValue = "10485760")
    long maxBytes;

    @Inject
    @ConfigProperty(name = "form.files.clamav.host", defaultValue = "")
    java.util.Optional<String> clamavHost;

    @ConfigProperty(name = "form.files.clamav.port", defaultValue = "3310")
    int clamavPort;

    @Inject
    PluginDataClient client;

    public record StoredFile(UUID fileId, String storageKey) {}

    public StoredFile store(UUID formId, String originalName, String contentType, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new ApiException(400, "FORM_FILE_EMPTY", "File is empty");
        }
        if (bytes.length > maxBytes) {
            throw new ApiException(400, "FORM_FILE_TOO_LARGE",
                    "File exceeds the limit of " + maxBytes + " bytes");
        }
        String extension = "";
        int dot = originalName == null ? -1 : originalName.lastIndexOf('.');
        if (dot >= 0) {
            extension = originalName.substring(dot);
        }
        String storageKey = UUID.randomUUID() + extension;
        try {
            Path dir = Path.of(storageDir);
            Files.createDirectories(dir);
            Files.write(dir.resolve(storageKey), bytes);
        } catch (IOException e) {
            throw new ApiException(500, "FORM_FILE_STORE_FAILED",
                    "Cannot store the uploaded file");
        }
        String scanStatus = scan(bytes);
        var result = client.write("form.file.insert", Map.of(
                "form_id", formId,
                "storage_key", storageKey,
                "original_name", originalName == null ? "file" : originalName,
                "content_type", contentType,
                "size_bytes", bytes.length,
                "scan_status", scanStatus));
        Map<String, Object> row = result.first();
        if ("INFECTED".equals(row.get("scan_status"))) {
            cleanup(storageKey);
            throw new ApiException(400, "FORM_FILE_INFECTED",
                    "Uploaded file failed the virus scan");
        }
        return new StoredFile(UUID.fromString(row.get("id").toString()), storageKey);
    }

    public Map<String, Object> loadFile(UUID fileId) {
        var rows = client.query("form.file.get", Map.of("id", fileId)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, "FORM_FILE_NOT_FOUND", "File was not found");
        }
        return rows.get(0);
    }

    public byte[] readStored(String storageKey) {
        try {
            return Files.readAllBytes(Path.of(storageDir).resolve(storageKey));
        } catch (IOException e) {
            throw new ApiException(404, "FORM_FILE_NOT_FOUND", "File content is gone");
        }
    }

    public String signedUrl(UUID fileId) {
        long expires = System.currentTimeMillis() / 1000 + ttlSeconds;
        String signature = sign(fileId.toString(), expires);
        return "/api/v1/form/signed-documents/" + fileId
                + "?expires=" + expires + "&sig=" + signature;
    }

    public void verifySignature(UUID fileId, String expiresParam, String signature) {
        if (expiresParam == null || signature == null || signature.isBlank()) {
            throw new ApiException(401, "FORM_FILE_SIGNATURE_INVALID", "Missing signature");
        }
        long expires;
        try {
            expires = Long.parseLong(expiresParam);
        } catch (NumberFormatException e) {
            throw new ApiException(401, "FORM_FILE_SIGNATURE_INVALID", "Invalid expiry");
        }
        if (expires < System.currentTimeMillis() / 1000) {
            throw new ApiException(401, "FORM_FILE_SIGNATURE_EXPIRED", "Signed URL expired");
        }
        if (!sign(fileId.toString(), expires).equals(signature)) {
            throw new ApiException(401, "FORM_FILE_SIGNATURE_INVALID", "Signature mismatch");
        }
    }

    private String sign(String fileId, long expires) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingSecret.getBytes(), "HmacSHA256"));
            return HexFormat.of().formatHex(
                    mac.doFinal((fileId + ":" + expires).getBytes()));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC unavailable", e);
        }
    }

    /** ClamAV INSTREAM when configured; otherwise PENDING (fail-open like employee). */
    private String scan(byte[] bytes) {
        if (clamavHost == null || clamavHost.isEmpty()) {
            return "PENDING";
        }
        try (java.net.Socket socket = new java.net.Socket(clamavHost.get(), clamavPort);
                var out = socket.getOutputStream();
                var in = socket.getInputStream()) {
            out.write(new byte[] {'z', 'I', 'N', 'S', 'T', 'R', 'E', 'A', 'M', '\0'});
            out.write(java.nio.ByteBuffer.allocate(4)
                    .putInt(bytes.length).array());
            out.write(bytes);
            out.write(new byte[] {0, 0, 0, 0});
            out.flush();
            byte[] response = in.readAllBytes();
            String verdict = new String(response).trim();
            if (verdict.endsWith("OK")) {
                return "CLEAN";
            }
            return "INFECTED";
        } catch (Exception e) {
            return "PENDING";
        }
    }

    private void cleanup(String storageKey) {
        try {
            Files.deleteIfExists(Path.of(storageDir).resolve(storageKey));
        } catch (IOException ignored) {
            // Best-effort cleanup of an infected upload.
        }
    }
}
