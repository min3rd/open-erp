package com.vn9melody.openerp.plugins.office.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.office.api.OfficeErrorCode;
import com.vn9melody.openerp.plugins.office.dto.CreateOfficeDocumentRequest;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentPermissionDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentVersionDto;
import com.vn9melody.openerp.plugins.office.dto.ShareOfficeDocumentRequest;
import com.vn9melody.openerp.plugins.office.dto.UpdateOfficeDocumentRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class OfficeDocumentService {

    private static final Set<String> EXTENSIONS = Set.of("docx", "xlsx", "pptx", "csv", "pdf");
    private static final Set<String> DOC_TYPES = Set.of("WORD", "EXCEL", "POWERPOINT", "CSV", "PDF");
    private static final Set<String> STATUSES = Set.of("ACTIVE", "ARCHIVED", "DELETED");
    private static final long MAX_CONTENT_BYTES = 25L * 1024 * 1024;

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    @Inject
    OfficeBlobStore blobStore;

    public record StoredContent(byte[] bytes, String fileName, String mimeType, int version, String checksumSha256) {}

    public List<OfficeDocumentDto> list() {
        UUID userId = context.userId();
        boolean platform = context.platform();
        return client.query("office.document.list", Map.of()).rows().stream()
                .map(OfficeDocumentDto::from)
                .filter(document -> OfficeAccessPolicy.canRead(document, userId, platform, permissionsOf(document.id())))
                .toList();
    }

    public OfficeDocumentDto get(UUID id) {
        return requireRead(id);
    }

    public OfficeDocumentDto create(CreateOfficeDocumentRequest request) {
        String title = trim(request == null ? null : request.title());
        if (title == null || title.isBlank()) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_TITLE_REQUIRED, "title is required");
        }
        String filename = trim(request.originalFilename());
        if (filename == null || filename.isBlank()) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_TITLE_REQUIRED, "original_filename is required");
        }
        String extension = trim(request.fileExtension());
        if (extension == null) {
            extension = extensionOf(filename);
        }
        extension = extension == null ? null : extension.toLowerCase();
        if (extension == null || !EXTENSIONS.contains(extension)) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_UNSUPPORTED_EXTENSION,
                    "Unsupported office extension");
        }
        String docType = trim(request.docType());
        if (docType == null) {
            docType = docTypeOf(extension);
        }
        docType = docType == null ? null : docType.toUpperCase();
        if (docType == null || !DOC_TYPES.contains(docType)) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_DOC_TYPE_INVALID, "Invalid doc_type");
        }

        UUID userId = context.userId();
        Instant now = Instant.now();
        Map<String, Object> params = new HashMap<>();
        params.put("title", title);
        params.put("original_filename", filename);
        params.put("file_extension", extension);
        params.put("doc_type", docType);
        params.put("mime_type", defaultMime(request.mimeType(), extension));
        params.put("size_bytes", request.sizeBytes() == null ? 0L : Math.max(0L, request.sizeBytes()));
        params.put("storage_key", "");
        params.put("checksum_sha256", "");
        params.put("current_version", 1);
        params.put("status", "ACTIVE");
        params.put("created_by", userId);
        params.put("updated_by", userId);
        params.put("created_at", now);
        params.put("updated_at", now);
        return OfficeDocumentDto.from(client.write("office.document.insert", params).first());
    }

    public OfficeDocumentDto update(UUID id, UpdateOfficeDocumentRequest request) {
        requireWrite(id);
        String title = trim(request == null ? null : request.title());
        String status = trim(request == null ? null : request.status());
        if (title == null && status == null) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_TITLE_REQUIRED, "title or status is required");
        }
        if (status != null && !STATUSES.contains(status.toUpperCase())) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_STATUS_INVALID, "Invalid status");
        }
        Map<String, Object> params = new HashMap<>();
        if (title != null) params.put("title", title);
        if (status != null) params.put("status", status.toUpperCase());
        params.put("updated_by", context.userId());
        params.put("updated_at", Instant.now());
        params.put("id", id);
        return OfficeDocumentDto.from(client.write("office.document.update", params).first());
    }

    public OfficeDocumentDto delete(UUID id) {
        requireWrite(id);
        Instant now = Instant.now();
        Map<String, Object> params = new HashMap<>();
        params.put("status", "DELETED");
        params.put("deleted_at", now);
        params.put("updated_by", context.userId());
        params.put("updated_at", now);
        params.put("id", id);
        return OfficeDocumentDto.from(client.write("office.document.delete", params).first());
    }

    public List<OfficeDocumentVersionDto> versions(UUID id) {
        requireRead(id);
        return client.query("office.version.list", Map.of("document_id", id)).rows().stream()
                .map(OfficeDocumentVersionDto::from)
                .toList();
    }

    public OfficeDocumentDto uploadContent(UUID id, byte[] bytes, String fileName,
                                           String changeNote, Integer expectedVersion) {
        OfficeDocumentDto document = requireWrite(id);
        if (expectedVersion != null && expectedVersion != document.currentVersion()) {
            Map<String, Object> params = new HashMap<>();
            params.put("expected_version", expectedVersion);
            params.put("current_version", document.currentVersion());
            throw new ApiException(409, OfficeErrorCode.OFFICE_VERSION_CONFLICT,
                    "Document version conflict", params);
        }
        if (bytes == null || bytes.length == 0) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_FILE_REQUIRED, "A file part is required");
        }
        if (bytes.length > MAX_CONTENT_BYTES) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_FILE_TOO_LARGE,
                    "Office file is too large", Map.of("max_mb", 25, "actual_mb", bytes.length / (1024 * 1024)));
        }
        validateMagic(document.fileExtension(), bytes);

        int nextVersion = document.currentVersion() + 1;
        UUID userId = context.userId();
        Instant now = Instant.now();
        OfficeBlobStore.StoredBinary stored = blobStore.put(
                context.tenantId(), id, nextVersion, fileName == null ? document.originalFilename() : fileName, bytes);

        Map<String, Object> versionParams = new HashMap<>();
        versionParams.put("document_id", id);
        versionParams.put("version_number", nextVersion);
        versionParams.put("size_bytes", stored.sizeBytes());
        versionParams.put("storage_key", stored.storageKey());
        versionParams.put("checksum_sha256", stored.checksumSha256());
        versionParams.put("change_note", changeNote);
        versionParams.put("created_by", userId);
        versionParams.put("created_at", now);
        client.write("office.version.insert", versionParams);

        Map<String, Object> documentParams = new HashMap<>();
        documentParams.put("size_bytes", stored.sizeBytes());
        documentParams.put("storage_key", stored.storageKey());
        documentParams.put("checksum_sha256", stored.checksumSha256());
        documentParams.put("current_version", nextVersion);
        documentParams.put("updated_by", userId);
        documentParams.put("updated_at", now);
        documentParams.put("id", id);
        return OfficeDocumentDto.from(client.write("office.document.update", documentParams).first());
    }

    public StoredContent downloadContent(UUID id, Integer requestedVersion) {
        OfficeDocumentDto document = requireRead(id);
        int versionNumber = requestedVersion == null ? document.currentVersion() : requestedVersion;
        var result = client.query("office.version.get", Map.of(
                "document_id", id,
                "version_number", versionNumber));
        if (result.isEmpty()) {
            throw new ApiException(404, OfficeErrorCode.OFFICE_DOCUMENT_NOT_FOUND,
                    "Document version not found", Map.of("version", versionNumber));
        }
        OfficeDocumentVersionDto version = OfficeDocumentVersionDto.from(result.first());
        byte[] bytes = blobStore.get(version.storageKey());
        return new StoredContent(bytes, document.originalFilename(), document.mimeType(),
                version.versionNumber(), version.checksumSha256());
    }

    public List<OfficeDocumentPermissionDto> permissions(UUID id) {
        requireWrite(id);
        return permissionsOf(id);
    }

    public OfficeDocumentPermissionDto share(UUID id, ShareOfficeDocumentRequest request) {
        OfficeDocumentDto document = requireOwner(id);
        String subjectType = trim(request == null ? null : request.subjectType());
        String permission = trim(request == null ? null : request.permission());
        subjectType = subjectType == null ? null : subjectType.toUpperCase();
        permission = permission == null ? null : permission.toUpperCase();
        if (!"USER".equals(subjectType) && !"ROLE".equals(subjectType)) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_DOCUMENT_NOT_FOUND, "subject_type must be USER or ROLE");
        }
        if (!"READ".equals(permission) && !"WRITE".equals(permission)) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_STATUS_INVALID, "permission must be READ or WRITE");
        }
        if (request.subjectId() == null) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_DOCUMENT_NOT_FOUND, "subject_id is required");
        }
        if (request.subjectId().equals(document.createdBy())) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_DOCUMENT_NOT_FOUND, "owner already has full access");
        }
        Map<String, Object> params = new HashMap<>();
        params.put("document_id", id);
        params.put("subject_type", subjectType);
        params.put("subject_id", request.subjectId());
        params.put("permission", permission);
        params.put("created_by", context.userId());
        params.put("created_at", Instant.now());
        return OfficeDocumentPermissionDto.from(client.write("office.permission.insert", params).first());
    }

    public PermissionRevocation revoke(UUID id, UUID permissionId) {
        requireOwner(id);
        var result = client.write("office.permission.delete", Map.of("id", permissionId, "document_id", id));
        if (result.affectedRows() == 0) {
            throw new ApiException(404, OfficeErrorCode.OFFICE_DOCUMENT_NOT_FOUND, "Permission not found");
        }
        return new PermissionRevocation(permissionId, true);
    }

    public record PermissionRevocation(UUID id, boolean revoked) {}

    private List<OfficeDocumentPermissionDto> permissionsOf(UUID id) {
        return client.query("office.permission.list", Map.of("document_id", id)).rows().stream()
                .map(OfficeDocumentPermissionDto::from)
                .toList();
    }

    private OfficeDocumentDto requireRead(UUID id) {
        OfficeDocumentDto document = loadDocument(id);
        if (!OfficeAccessPolicy.canRead(document, context.userId(), context.platform(), permissionsOf(id))) {
            throw new ApiException(403, OfficeErrorCode.OFFICE_FORBIDDEN, "Office document access denied");
        }
        return document;
    }

    private OfficeDocumentDto requireWrite(UUID id) {
        OfficeDocumentDto document = loadDocument(id);
        if (!OfficeAccessPolicy.canWrite(document, context.userId(), context.platform(), permissionsOf(id))) {
            throw new ApiException(403, OfficeErrorCode.OFFICE_FORBIDDEN, "Office document write denied");
        }
        return document;
    }

    private OfficeDocumentDto requireOwner(UUID id) {
        OfficeDocumentDto document = loadDocument(id);
        if (!OfficeAccessPolicy.canManage(document, context.userId(), context.platform())) {
            throw new ApiException(403, OfficeErrorCode.OFFICE_FORBIDDEN, "Only the owner can manage sharing");
        }
        return document;
    }

    private OfficeDocumentDto loadDocument(UUID id) {
        if (id == null) {
            throw new ApiException(404, OfficeErrorCode.OFFICE_DOCUMENT_NOT_FOUND, "Document not found");
        }
        var result = client.query("office.document.get", Map.of("id", id));
        if (result.isEmpty()) {
            throw new ApiException(404, OfficeErrorCode.OFFICE_DOCUMENT_NOT_FOUND, "Document not found");
        }
        return OfficeDocumentDto.from(result.first());
    }

    private static void validateMagic(String extension, byte[] bytes) {
        boolean zip = bytes.length >= 4 && bytes[0] == 0x50 && bytes[1] == 0x4b && bytes[2] == 0x03 && bytes[3] == 0x04;
        boolean ole2 = bytes.length >= 8 && (bytes[0] & 0xff) == 0xd0 && (bytes[1] & 0xff) == 0xcf
                && (bytes[2] & 0xff) == 0x11 && (bytes[3] & 0xff) == 0xe0;
        boolean pdf = bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F' && bytes[4] == '-';
        String ext = extension == null ? "" : extension.toLowerCase();
        boolean valid = switch (ext) {
            case "docx", "xlsx", "pptx" -> zip;
            case "pdf" -> pdf;
            case "csv" -> !containsNul(bytes);
            default -> zip || ole2 || pdf || !containsNul(bytes);
        };
        if (!valid) {
            throw new ApiException(400, OfficeErrorCode.OFFICE_INVALID_MAGIC_BYTES,
                    "File signature does not match its extension", Map.of("extension", ext));
        }
    }

    private static boolean containsNul(byte[] bytes) {
        for (byte value : bytes) if (value == 0) return true;
        return false;
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 || dot == filename.length() - 1 ? null : filename.substring(dot + 1);
    }

    private static String docTypeOf(String extension) {
        return switch (extension) {
            case "docx" -> "WORD";
            case "xlsx" -> "EXCEL";
            case "pptx" -> "POWERPOINT";
            case "csv" -> "CSV";
            case "pdf" -> "PDF";
            default -> null;
        };
    }

    private static String defaultMime(String mime, String extension) {
        String value = trim(mime);
        if (value != null && !value.isBlank()) return value;
        return switch (extension) {
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "csv" -> "text/csv";
            case "pdf" -> "application/pdf";
            default -> "application/octet-stream";
        };
    }
}
