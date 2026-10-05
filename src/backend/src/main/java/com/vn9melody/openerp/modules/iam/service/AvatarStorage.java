package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.storage.TenantFileStorage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Account avatar storage (TASK-354). Tenant files live in their own bucket
 * ({@code tenant-files}) with a {@code <tenantId>/avatars/…} key, separate from
 * plugin artifacts. Images are validated at the trust boundary (extension + size).
 */
@ApplicationScoped
public class AvatarStorage {

    private static final Map<String, String> TYPE_BY_EXTENSION = Map.of(
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "webp", "image/webp",
            "gif", "image/gif");

    @Inject
    TenantFileStorage tenantFileStorage;

    @ConfigProperty(name = "openerp.account.avatar-max-bytes", defaultValue = "2097152")
    long maxBytes;

    public record StoredAvatar(byte[] bytes, String contentType) {}

    /** Stores the image and returns the URL that serves it. */
    public String storeUrl(UUID tenantId, UUID userId, String originalFileName, byte[] bytes) {
        String extension = extensionOf(originalFileName);
        if (!TYPE_BY_EXTENSION.containsKey(extension)) {
            throw new ApiException(400, ErrorCode.ACCOUNT_AVATAR_INVALID_TYPE,
                    "Unsupported image type. Use PNG, JPEG, WEBP or GIF.");
        }
        if (bytes == null || bytes.length == 0) {
            throw new ApiException(400, ErrorCode.ACCOUNT_AVATAR_INVALID_TYPE, "Empty file");
        }
        if (bytes.length > maxBytes) {
            throw new ApiException(413, ErrorCode.ACCOUNT_AVATAR_TOO_LARGE, "Avatar exceeds the size limit");
        }
        String fileName = "avatar-" + userId + "-" + System.currentTimeMillis() + "." + extension;
        TenantFileStorage.StoredTenantFile stored =
                tenantFileStorage.store(tenantId, "avatars", fileName, new ByteArrayInputStream(bytes));
        return "/api/v1/account/avatar?ref=" + URLEncoder.encode(stored.ref(), StandardCharsets.UTF_8);
    }

    public StoredAvatar read(String ref) {
        if (ref == null || ref.isBlank()) {
            throw new ApiException(400, ErrorCode.ACCOUNT_AVATAR_NOT_FOUND, "Invalid avatar reference");
        }
        byte[] bytes;
        try (InputStream content = tenantFileStorage.open(ref)) {
            bytes = content.readAllBytes();
        } catch (ApiException e) {
            throw new ApiException(404, ErrorCode.ACCOUNT_AVATAR_NOT_FOUND, "Avatar not found");
        } catch (IOException e) {
            throw new ApiException(500, ErrorCode.ACCOUNT_AVATAR_NOT_FOUND, "Cannot read the avatar");
        }
        String type = TYPE_BY_EXTENSION.getOrDefault(extensionOf(ref), "application/octet-stream");
        return new StoredAvatar(bytes, type);
    }

    private String extensionOf(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        String extension = fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
        return "jpeg".equals(extension) ? "jpg" : extension;
    }
}
