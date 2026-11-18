package com.vn9melody.openerp.plugins.office.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.office.dto.CreateOfficeDocumentRequest;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentPermissionDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentVersionDto;
import com.vn9melody.openerp.plugins.office.dto.ShareOfficeDocumentRequest;
import com.vn9melody.openerp.plugins.office.dto.UpdateOfficeDocumentRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test for OfficeDocumentService against a real PostgreSQL instance.
 * Runs only when the database is reachable (or OFFICE_IT_DB_URL is provided).
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OfficeDocumentServicePostgresTest {

    private static final String DB_URL = env("OFFICE_IT_DB_URL", "jdbc:postgresql://localhost:5432/openerp_dev");
    private static final String DB_USER = env("OFFICE_IT_DB_USER", "openerp");
    private static final String DB_PASSWORD = env("OFFICE_IT_DB_PASSWORD", "openerp_dev_password");

    private Connection connection;
    private String schema;
    private Path blobDir;
    private OfficeDocumentService service;
    private MutableTenantContext context;

    private final UUID tenantA = UUID.randomUUID();
    private final UUID tenantB = UUID.randomUUID();
    private final UUID owner = UUID.randomUUID();
    private final UUID collaborator = UUID.randomUUID();
    private final UUID reader = UUID.randomUUID();

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.postgresql.Driver");
        try {
            connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
        } catch (SQLException unavailable) {
            System.err.println("POSTGRES_IT_SKIP " + unavailable.getMessage());
            Assumptions.abort("PostgreSQL is not available at " + DB_URL + ": " + unavailable.getMessage());
        }
        schema = "office_it_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
            statement.execute("SET search_path TO " + schema);
        }
        applyMigrations();

        blobDir = Files.createTempDirectory("office-it-blobs");
        OfficeBlobStore blobStore = new OfficeBlobStore();
        blobStore.storageDir = blobDir.toString();
        blobStore.minioEndpoint = "";

        context = new MutableTenantContext(tenantA, owner);
        service = new OfficeDocumentService();
        service.client = new JdbcPluginDataClient(connection, context);
        service.context = context;
        service.blobStore = blobStore;
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection == null) return;
        try (Statement statement = connection.createStatement()) {
            statement.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        }
        connection.close();
        if (blobDir != null && Files.exists(blobDir)) {
            try (var walk = Files.walk(blobDir)) {
                walk.sorted((a, b) -> b.compareTo(a)).forEach(path -> {
                    try {
                        Files.deleteIfExists(path);
                    } catch (Exception ignored) {
                        // best-effort cleanup
                    }
                });
            }
        }
    }

    @Test
    void documentLifecycleWithRealPostgres() throws Exception {
        assertTrue(service.list().isEmpty());

        OfficeDocumentDto created = service.create(new CreateOfficeDocumentRequest(
                "Báo cáo Q4", "report.docx", "docx", "WORD", null, 0L));
        assertNotNull(created.id());
        assertEquals("ACTIVE", created.status());
        assertEquals(1, created.currentVersion());
        assertEquals(tenantA, tenantOf(created.id()));

        OfficeDocumentDto second = service.create(new CreateOfficeDocumentRequest(
                "Bảng lương", "payroll.xlsx", "xlsx", "EXCEL", null, 0L));
        assertEquals(2, service.list().size());

        OfficeDocumentDto renamed = service.update(created.id(),
                new UpdateOfficeDocumentRequest("Báo cáo Q4 (final)", "ARCHIVED"));
        assertEquals("Báo cáo Q4 (final)", renamed.title());
        assertEquals("ARCHIVED", renamed.status());

        byte[] content = "PK\u0003\u0004office-integration".getBytes(StandardCharsets.UTF_8);
        OfficeDocumentDto uploaded = service.uploadContent(created.id(), content, "report.docx", "first upload", 1);
        assertEquals(2, uploaded.currentVersion());
        assertEquals(content.length, uploaded.sizeBytes());
        assertEquals(sha256(content), uploaded.checksumSha256());

        OfficeDocumentService.StoredContent downloaded = service.downloadContent(created.id(), null);
        assertArrayEquals(content, downloaded.bytes());
        assertEquals(2, downloaded.version());
        assertEquals(sha256(content), downloaded.checksumSha256());

        List<OfficeDocumentVersionDto> versions = service.versions(created.id());
        assertEquals(1, versions.size());
        assertEquals(2, versions.get(0).versionNumber());
        System.out.println("POSTGRES_IT_OK document=" + created.id()
                + " version=" + uploaded.currentVersion()
                + " bytes=" + downloaded.bytes().length
                + " checksum=" + downloaded.checksumSha256()
                + " versions=" + versions.size());

        ApiException conflict = assertThrows(ApiException.class,
                () -> service.uploadContent(created.id(), content, "report.docx", "stale", 1));
        assertEquals(409, conflict.getStatusCode());
        assertEquals("OFFICE_VERSION_CONFLICT", conflict.getCode());

        byte[] secondContent = "PK\u0003\u0004second-version".getBytes(StandardCharsets.UTF_8);
        service.uploadContent(created.id(), secondContent, "report.docx", "second upload", 2);
        assertArrayEquals(secondContent, service.downloadContent(created.id(), 3).bytes());
        assertArrayEquals(content, service.downloadContent(created.id(), 2).bytes());

        OfficeDocumentPermissionDto readPermission = service.share(created.id(),
                new ShareOfficeDocumentRequest("USER", reader, "READ"));
        OfficeDocumentPermissionDto writePermission = service.share(created.id(),
                new ShareOfficeDocumentRequest("USER", collaborator, "WRITE"));
        assertNotNull(readPermission.id());
        assertNotNull(writePermission.id());
        assertEquals(2, service.permissions(created.id()).size());

        context.use(tenantA, reader);
        assertEquals("Báo cáo Q4 (final)", service.get(created.id()).title());
        assertThrows(ApiException.class, () -> service.update(created.id(),
                new UpdateOfficeDocumentRequest("reader edit", null)));

        context.use(tenantA, collaborator);
        assertEquals("collab edit", service.update(created.id(),
                new UpdateOfficeDocumentRequest("collab edit", null)).title());

        context.use(tenantB, owner);
        assertTrue(service.list().isEmpty());
        ApiException crossTenant = assertThrows(ApiException.class, () -> service.get(created.id()));
        assertEquals(404, crossTenant.getStatusCode());

        context.use(tenantA, owner);
        OfficeDocumentService.PermissionRevocation revocation = service.revoke(created.id(), readPermission.id());
        assertTrue(revocation.revoked());
        assertEquals(1, service.permissions(created.id()).size());

        OfficeDocumentDto deleted = service.delete(second.id());
        assertEquals("DELETED", deleted.status());
        assertNotNull(service.get(second.id()));
    }

    private void applyMigrations() throws Exception {
        for (String file : List.of(
                "V1.0.0__office_documents.sql",
                "V1.0.1__office_document_versions.sql",
                "V1.0.2__office_document_permissions.sql")) {
            String sql = Files.readString(resolveMigration(file));
            try (Statement statement = connection.createStatement()) {
                for (String part : sql.split(";")) {
                    if (!part.trim().isEmpty()) statement.execute(part);
                }
            }
        }
    }

    private static Path resolveMigration(String file) {
        Path direct = Path.of("migrations", file);
        if (Files.exists(direct)) return direct;
        Path fromRoot = Path.of("plugins", "office-webapp", "migrations", file);
        if (Files.exists(fromRoot)) return fromRoot;
        throw new IllegalStateException("Migration not found: " + file);
    }

    private UUID tenantOf(UUID documentId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT tenant_id FROM plg_office_documents WHERE id = ?")) {
            statement.setObject(1, documentId);
            try (ResultSet result = statement.executeQuery()) {
                assertTrue(result.next());
                return result.getObject(1, UUID.class);
            }
        }
    }

    private static String sha256(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    static final class MutableTenantContext extends TenantContext {
        private UUID tenantId;
        private UUID userId;
        private boolean platform;

        MutableTenantContext(UUID tenantId, UUID userId) {
            this.tenantId = tenantId;
            this.userId = userId;
        }

        void use(UUID tenantId, UUID userId) {
            this.tenantId = tenantId;
            this.userId = userId;
        }

        @Override
        public UUID tenantId() {
            return tenantId;
        }

        @Override
        public UUID userId() {
            return userId;
        }

        @Override
        public boolean platform() {
            return platform;
        }
    }

    /** Minimal JDBC implementation of the plugin query descriptors used by the service. */
    static final class JdbcPluginDataClient extends PluginDataClient {
        private static final String DOCUMENT_COLUMNS =
                "id, tenant_id, title, original_filename, file_extension, doc_type, mime_type, size_bytes, "
                        + "storage_key, checksum_sha256, current_version, status, created_by, updated_by, "
                        + "created_at, updated_at, deleted_at";
        private static final String VERSION_COLUMNS =
                "id, tenant_id, document_id, version_number, size_bytes, storage_key, checksum_sha256, "
                        + "change_note, created_by, created_at";
        private static final String PERMISSION_COLUMNS =
                "id, tenant_id, document_id, subject_type, subject_id, permission, created_by, created_at";

        private final Connection connection;
        private final MutableTenantContext context;

        JdbcPluginDataClient(Connection connection, MutableTenantContext context) {
            this.connection = connection;
            this.context = context;
        }

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params) {
            return switch (queryId) {
                case "office.document.list" -> rows("SELECT " + DOCUMENT_COLUMNS
                        + " FROM plg_office_documents WHERE tenant_id = ?"
                        + " ORDER BY updated_at DESC LIMIT 100", context.tenantId());
                case "office.document.get" -> rows("SELECT " + DOCUMENT_COLUMNS
                        + " FROM plg_office_documents WHERE tenant_id = ? AND id = ?",
                        context.tenantId(), params.get("id"));
                case "office.version.list" -> rows("SELECT " + VERSION_COLUMNS
                        + " FROM plg_office_document_versions WHERE tenant_id = ? AND document_id = ?"
                        + " ORDER BY version_number DESC", context.tenantId(), params.get("document_id"));
                case "office.version.get" -> rows("SELECT " + VERSION_COLUMNS
                        + " FROM plg_office_document_versions WHERE tenant_id = ? AND document_id = ?"
                        + " AND version_number = ?", context.tenantId(), params.get("document_id"),
                        params.get("version_number"));
                case "office.permission.list" -> rows("SELECT " + PERMISSION_COLUMNS
                        + " FROM plg_office_document_permissions WHERE tenant_id = ? AND document_id = ?"
                        + " ORDER BY created_at ASC", context.tenantId(), params.get("document_id"));
                default -> throw new IllegalArgumentException("Unsupported query " + queryId);
            };
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            try {
                return switch (queryId) {
                    case "office.document.insert" -> insertDocument(params);
                    case "office.document.update" -> updateDocument(params);
                    case "office.document.delete" -> deleteDocument(params);
                    case "office.version.insert" -> insertVersion(params);
                    case "office.permission.insert" -> insertPermission(params);
                    case "office.permission.delete" -> deletePermission(params);
                    default -> throw new IllegalArgumentException("Unsupported write " + queryId);
                };
            } catch (SQLException e) {
                throw new IllegalStateException("JDBC write failed: " + queryId, e);
            }
        }

        private PluginQueryResult insertDocument(Map<String, ?> params) throws SQLException {
            String sql = "INSERT INTO plg_office_documents (tenant_id, title, original_filename, file_extension,"
                    + " doc_type, mime_type, size_bytes, storage_key, checksum_sha256, current_version, status,"
                    + " created_by, updated_by, created_at, updated_at)"
                    + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING " + DOCUMENT_COLUMNS;
            List<Object> values = List.of(context.tenantId(), params.get("title"), params.get("original_filename"),
                    params.get("file_extension"), params.get("doc_type"), params.get("mime_type"),
                    params.get("size_bytes"), params.get("storage_key"), params.get("checksum_sha256"),
                    params.get("current_version"), params.get("status"), params.get("created_by"),
                    params.get("updated_by"), params.get("created_at"), params.get("updated_at"));
            return rows(sql, values.toArray());
        }

        private PluginQueryResult updateDocument(Map<String, ?> params) throws SQLException {
            Map<String, Object> values = new LinkedHashMap<>();
            for (String key : List.of("title", "status", "size_bytes", "storage_key", "checksum_sha256",
                    "current_version", "deleted_at")) {
                if (params.containsKey(key)) values.put(key, params.get(key));
            }
            values.put("updated_by", params.get("updated_by"));
            values.put("updated_at", params.get("updated_at"));
            StringBuilder sql = new StringBuilder("UPDATE plg_office_documents SET ");
            List<Object> args = new ArrayList<>();
            values.forEach((key, value) -> {
                if (args.size() > 0) sql.append(", ");
                sql.append(key).append(" = ?");
                args.add(value);
            });
            sql.append(" WHERE tenant_id = ? AND id = ? RETURNING ").append(DOCUMENT_COLUMNS);
            args.add(context.tenantId());
            args.add(params.get("id"));
            return rows(sql.toString(), args.toArray());
        }

        private PluginQueryResult deleteDocument(Map<String, ?> params) throws SQLException {
            return rows("UPDATE plg_office_documents SET status = ?, deleted_at = ?, updated_by = ?,"
                            + " updated_at = ? WHERE tenant_id = ? AND id = ? RETURNING " + DOCUMENT_COLUMNS,
                    params.get("status"), params.get("deleted_at"), params.get("updated_by"),
                    params.get("updated_at"), context.tenantId(), params.get("id"));
        }

        private PluginQueryResult insertVersion(Map<String, ?> params) throws SQLException {
            int affected = execute("INSERT INTO plg_office_document_versions (tenant_id, document_id,"
                            + " version_number, size_bytes, storage_key, checksum_sha256, change_note,"
                            + " created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    context.tenantId(), params.get("document_id"), params.get("version_number"),
                    params.get("size_bytes"), params.get("storage_key"), params.get("checksum_sha256"),
                    params.get("change_note"), params.get("created_by"), params.get("created_at"));
            return new PluginQueryResult(List.of(), 0, affected);
        }

        private PluginQueryResult insertPermission(Map<String, ?> params) throws SQLException {
            return rows("INSERT INTO plg_office_document_permissions (tenant_id, document_id, subject_type,"
                            + " subject_id, permission, created_by, created_at) VALUES (?,?,?,?,?,?,?) RETURNING "
                            + PERMISSION_COLUMNS,
                    context.tenantId(), params.get("document_id"), params.get("subject_type"),
                    params.get("subject_id"), params.get("permission"), params.get("created_by"),
                    params.get("created_at"));
        }

        private PluginQueryResult deletePermission(Map<String, ?> params) throws SQLException {
            int affected = execute("DELETE FROM plg_office_document_permissions"
                            + " WHERE tenant_id = ? AND document_id = ? AND id = ?",
                    context.tenantId(), params.get("document_id"), params.get("id"));
            return new PluginQueryResult(List.of(), 0, affected);
        }

        private int execute(String sql, Object... values) throws SQLException {
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                bind(statement, values);
                return statement.executeUpdate();
            }
        }

        private PluginQueryResult rows(String sql, Object... values) {
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                bind(statement, values);
                try (ResultSet result = statement.executeQuery()) {
                    List<Map<String, Object>> rows = new ArrayList<>();
                    ResultSetMetaData meta = result.getMetaData();
                    while (result.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int index = 1; index <= meta.getColumnCount(); index++) {
                            row.put(meta.getColumnLabel(index), normalize(result.getObject(index)));
                        }
                        rows.add(row);
                    }
                    return new PluginQueryResult(rows, rows.size(), 0);
                }
            } catch (SQLException e) {
                throw new IllegalStateException("JDBC query failed: " + sql, e);
            }
        }

        private static void bind(PreparedStatement statement, Object... values) throws SQLException {
            for (int index = 0; index < values.length; index++) {
                Object value = values[index];
                if (value instanceof Instant instant) {
                    statement.setTimestamp(index + 1, Timestamp.from(instant));
                } else if (value instanceof OffsetDateTime offset) {
                    statement.setTimestamp(index + 1, Timestamp.from(offset.toInstant()));
                } else {
                    statement.setObject(index + 1, value);
                }
            }
        }

        private static Object normalize(Object value) {
            if (value instanceof UUID uuid) return uuid.toString();
            if (value instanceof Timestamp timestamp) {
                return timestamp.toInstant().atOffset(ZoneOffset.UTC).toString();
            }
            if (value instanceof OffsetDateTime offset) return offset.toInstant().toString();
            if (value instanceof java.time.LocalDateTime local) {
                return local.atOffset(ZoneOffset.UTC).toInstant().toString();
            }
            return value;
        }
    }
}
