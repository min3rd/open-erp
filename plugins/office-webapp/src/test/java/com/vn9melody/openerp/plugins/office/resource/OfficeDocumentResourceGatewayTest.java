package com.vn9melody.openerp.plugins.office.resource;

import com.google.protobuf.NullValue;
import com.google.protobuf.Value;
import com.vn9melody.openerp.plugin.data.v1.ExecuteBatchRequest;
import com.vn9melody.openerp.plugin.data.v1.ExecuteBatchResponse;
import com.vn9melody.openerp.plugin.data.v1.ExecuteRequest;
import com.vn9melody.openerp.plugin.data.v1.ExecuteResponse;
import com.vn9melody.openerp.plugin.data.v1.PingRequest;
import com.vn9melody.openerp.plugin.data.v1.PingResponse;
import com.vn9melody.openerp.plugin.data.v1.PluginDataServiceGrpc;
import com.vn9melody.openerp.plugin.data.v1.Row;
import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import io.restassured.response.ValidatableResponse;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.io.File;
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

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end multipart test: HTTP resource -> OfficeDocumentService -> gRPC
 * PluginDataClient -> gRPC contract server -> real PostgreSQL.
 * The gRPC server implements the same PluginDataService contract used by the
 * core gateway; the core gateway implementation itself is covered by backend tests.
 */
@QuarkusTest
@TestProfile(OfficeDocumentResourceGatewayTest.GatewayProfile.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OfficeDocumentResourceGatewayTest {

    private static final int GATEWAY_PORT = 19090;
    private static final String DB_URL = env("OFFICE_IT_DB_URL", "jdbc:postgresql://localhost:5432/openerp_dev");
    private static final String DB_USER = env("OFFICE_IT_DB_USER", "openerp");
    private static final String DB_PASSWORD = env("OFFICE_IT_DB_PASSWORD", "openerp_dev_password");

    private static Connection connection;
    private static String schema;
    private static Server server;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final Map<String, String> authHeaders = new HashMap<>();

    public static class GatewayProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            Map<String, String> config = new HashMap<>();
            config.put("plugin.data.gateway-url", "http://localhost:" + GATEWAY_PORT);
            config.put("plugin.data.service-token", "");
            config.put("plugin.data.tls-ca", "");
            config.put("plugin.data.tls-cert", "");
            config.put("plugin.data.tls-key", "");
            config.put("office.document.storage-dir", Path.of(System.getProperty("java.io.tmpdir"), "open-erp-office-e2e").toString());
            config.put("office.document.minio-endpoint", " ");
            config.put("office.document.minio-access-key", "openerp");
            config.put("office.document.minio-secret-key", "openerp_minio_secret");
            config.put("office.document.minio-bucket", "tenant-files");
            config.put("office.document.minio-region", "us-east-1");
            return config;
        }
    }

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.postgresql.Driver");
        try {
            connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
        } catch (SQLException unavailable) {
            Assumptions.abort("PostgreSQL is not available at " + DB_URL + ": " + unavailable.getMessage());
        }
        schema = "office_e2e_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
            statement.execute("SET search_path TO " + schema);
        }
        applyMigrations();
        authHeaders.put("X-Tenant-Id", tenantId.toString());
        authHeaders.put("X-User-Id", userId.toString());
        authHeaders.put("X-User-Permissions", "office:document:read,office:document:write");
        server = NettyServerBuilder.forPort(GATEWAY_PORT)
                .addService(new TestGateway(connection, tenantId))
                .build()
                .start();
    }

    @AfterAll
    void tearDown() throws Exception {
        if (server != null) server.shutdownNow();
        if (connection != null) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
            }
            connection.close();
        }
    }

    @Test
    void multipartUploadThroughGrpcGateway() throws Exception {
        String createBody = """
                {"title":"E2E report","originalFilename":"e2e.docx","fileExtension":"docx","docType":"WORD"}
                """;
        var createResponse = given().headers(authHeaders).contentType(ContentType.JSON).body(createBody)
                .when().post("/api/v1/office/documents");
        System.out.println("CREATE " + createResponse.statusCode() + " " + createResponse.asString());
        String documentId = createResponse.then().statusCode(200)
                .body("success", org.hamcrest.Matchers.is(true))
                .body("code", org.hamcrest.Matchers.is("OFFICE_DOCUMENT_CREATED"))
                .extract().path("data.id");
        assertNotNull(documentId);

        byte[] content = "PK\u0003\u0004e2e-multipart".getBytes(StandardCharsets.UTF_8);
        ValidatableResponse upload = given().headers(authHeaders)
                .multiPart("file", "e2e.docx", content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                .formParam("expected_version", "1")
                .formParam("change_note", "e2e upload")
                .when().put("/api/v1/office/documents/" + documentId + "/content")
                .then().statusCode(200)
                .body("code", org.hamcrest.Matchers.is("OFFICE_DOCUMENT_SAVED"))
                .body("data.currentVersion", org.hamcrest.Matchers.is(2))
                .body("data.sizeBytes", org.hamcrest.Matchers.is(content.length));
        assertEquals(sha256(content), upload.extract().path("data.checksumSha256"));

        byte[] downloaded = given().headers(authHeaders)
                .when().get("/api/v1/office/documents/" + documentId + "/content")
                .then().statusCode(200)
                .header("X-Document-Version", "2")
                .extract().asByteArray();
        assertArrayEquals(content, downloaded);

        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT version_number, size_bytes, checksum_sha256, storage_key FROM plg_office_document_versions"
                        + " WHERE tenant_id = ? AND document_id = ? ORDER BY version_number DESC")) {
            statement.setObject(1, tenantId);
            statement.setObject(2, UUID.fromString(documentId));
            try (ResultSet result = statement.executeQuery()) {
                assertTrue(result.next());
                assertEquals(2, result.getInt("version_number"));
                assertEquals(content.length, result.getLong("size_bytes"));
                assertEquals(sha256(content), result.getString("checksum_sha256"));
                assertTrue(result.getString("storage_key").startsWith(tenantId + "/office/" + documentId + "/v2_"));
            }
        }
    }

    private void applyMigrations() throws Exception {
        for (String file : List.of(
                "V1.0.0__office_documents.sql",
                "V1.0.1__office_document_versions.sql",
                "V1.0.2__office_document_permissions.sql")) {
            String sql = Files.readString(resolveMigration(file));
            try (Statement statement = connection.createStatement()) {
                for (String part : sql.split(";")) if (!part.trim().isEmpty()) statement.execute(part);
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

    private static String sha256(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    /** In-process implementation of the PluginDataService contract backed by real PostgreSQL. */
    static final class TestGateway extends PluginDataServiceGrpc.PluginDataServiceImplBase {
        private static final String DOCUMENT_COLUMNS =
                "id, tenant_id, title, original_filename, file_extension, doc_type, mime_type, size_bytes, "
                        + "storage_key, checksum_sha256, current_version, status, created_by, updated_by, "
                        + "created_at, updated_at, deleted_at";
        private final Connection connection;
        private final UUID tenantId;

        TestGateway(Connection connection, UUID tenantId) {
            this.connection = connection;
            this.tenantId = tenantId;
        }

        @Override
        public void ping(PingRequest request, StreamObserver<PingResponse> observer) {
            observer.onNext(PingResponse.newBuilder().setService("test-gateway").setVersion("1.0.0").build());
            observer.onCompleted();
        }

        @Override
        public void execute(ExecuteRequest request, StreamObserver<ExecuteResponse> observer) {
            try {
                Result result = switch (request.getQueryId()) {
                    case "office.document.insert" -> insertDocument(request.getParamsMap());
                    case "office.document.get" -> rows("SELECT " + DOCUMENT_COLUMNS
                            + " FROM plg_office_documents WHERE tenant_id = ? AND id = ?",
                            tenantId, value(request.getParamsMap(), "id"));
                    case "office.document.list" -> rows("SELECT " + DOCUMENT_COLUMNS
                            + " FROM plg_office_documents WHERE tenant_id = ? ORDER BY updated_at DESC", tenantId);
                    case "office.document.update" -> updateDocument(request.getParamsMap());
                    case "office.version.insert" -> execute("INSERT INTO plg_office_document_versions"
                                    + " (tenant_id, document_id, version_number, size_bytes, storage_key, checksum_sha256,"
                                    + " change_note, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                            tenantId, value(request.getParamsMap(), "document_id"),
                            value(request.getParamsMap(), "version_number"), value(request.getParamsMap(), "size_bytes"),
                            value(request.getParamsMap(), "storage_key"), value(request.getParamsMap(), "checksum_sha256"),
                            value(request.getParamsMap(), "change_note"), value(request.getParamsMap(), "created_by"),
                            value(request.getParamsMap(), "created_at"));
                    case "office.version.get" -> rows("SELECT id, tenant_id, document_id, version_number, size_bytes,"
                                    + " storage_key, checksum_sha256, change_note, created_by, created_at"
                                    + " FROM plg_office_document_versions WHERE tenant_id = ? AND document_id = ? AND version_number = ?",
                            tenantId, value(request.getParamsMap(), "document_id"),
                            value(request.getParamsMap(), "version_number"));
                    case "office.version.list" -> rows("SELECT id, tenant_id, document_id, version_number, size_bytes,"
                                    + " storage_key, checksum_sha256, change_note, created_by, created_at"
                                    + " FROM plg_office_document_versions WHERE tenant_id = ? AND document_id = ?"
                                    + " ORDER BY version_number DESC", tenantId, value(request.getParamsMap(), "document_id"));
                    case "office.permission.list" -> rows("SELECT id, tenant_id, document_id, subject_type, subject_id,"
                                    + " permission, created_by, created_at FROM plg_office_document_permissions"
                                    + " WHERE tenant_id = ? AND document_id = ?", tenantId,
                            value(request.getParamsMap(), "document_id"));
                    default -> throw new IllegalArgumentException("Unsupported query " + request.getQueryId());
                };
                ExecuteResponse.Builder response = ExecuteResponse.newBuilder()
                        .setSuccess(true)
                        .setRequestId(request.getRequestId())
                        .setCode("PLUGIN_DATA_SUCCESS")
                        .addAllRows(result.rows.stream().map(TestGateway::row).toList())
                        .setTotalRows(result.rows.size())
                        .setAffectedRows(result.affected);
                observer.onNext(response.build());
                observer.onCompleted();
            } catch (Exception e) {
                observer.onError(e);
            }
        }

        @Override
        public void executeBatch(ExecuteBatchRequest request, StreamObserver<ExecuteBatchResponse> observer) {
            observer.onNext(ExecuteBatchResponse.newBuilder().setSuccess(true).build());
            observer.onCompleted();
        }

        private Result insertDocument(Map<String, Value> params) throws SQLException {
            String sql = "INSERT INTO plg_office_documents (tenant_id, title, original_filename, file_extension,"
                    + " doc_type, mime_type, size_bytes, storage_key, checksum_sha256, current_version, status,"
                    + " created_by, updated_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
                    + " RETURNING " + DOCUMENT_COLUMNS;
            return rows(sql, tenantId, value(params, "title"), value(params, "original_filename"),
                    value(params, "file_extension"), value(params, "doc_type"), value(params, "mime_type"),
                    value(params, "size_bytes"), value(params, "storage_key"), value(params, "checksum_sha256"),
                    value(params, "current_version"), value(params, "status"), value(params, "created_by"),
                    value(params, "updated_by"), value(params, "created_at"), value(params, "updated_at"));
        }

        private Result updateDocument(Map<String, Value> params) throws SQLException {
            Map<String, Object> values = new LinkedHashMap<>();
            for (String key : List.of("title", "status", "size_bytes", "storage_key", "checksum_sha256",
                    "current_version", "deleted_at")) {
                if (params.containsKey(key)) values.put(key, value(params, key));
            }
            values.put("updated_by", value(params, "updated_by"));
            values.put("updated_at", value(params, "updated_at"));
            StringBuilder sql = new StringBuilder("UPDATE plg_office_documents SET ");
            List<Object> args = new ArrayList<>();
            values.forEach((key, val) -> {
                if (!args.isEmpty()) sql.append(", ");
                sql.append(key).append(" = ?");
                args.add(val);
            });
            sql.append(" WHERE tenant_id = ? AND id = ? RETURNING ").append(DOCUMENT_COLUMNS);
            args.add(tenantId);
            args.add(value(params, "id"));
            return rows(sql.toString(), args.toArray());
        }

        private Result execute(String sql, Object... values) throws SQLException {
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                bind(statement, values);
                int affected = statement.executeUpdate();
                return new Result(List.of(), affected);
            }
        }

        private Result rows(String sql, Object... values) throws SQLException {
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
                    return new Result(rows, 0);
                }
            }
        }

        private static void bind(PreparedStatement statement, Object... values) throws SQLException {
            for (int index = 0; index < values.length; index++) {
                Object value = values[index];
                if (value instanceof Instant instant) statement.setTimestamp(index + 1, Timestamp.from(instant));
                else statement.setObject(index + 1, value);
            }
        }

        private static Object value(Map<String, Value> params, String key) {
            Value value = params.get(key);
            if (value == null || value.getKindCase() == Value.KindCase.NULL_VALUE) return null;
            return switch (value.getKindCase()) {
                case NUMBER_VALUE -> {
                    double number = value.getNumberValue();
                    yield number == Math.rint(number) ? (long) number : number;
                }
                case BOOL_VALUE -> value.getBoolValue();
                case STRING_VALUE -> {
                    String text = value.getStringValue();
                    if (text.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
                        yield UUID.fromString(text);
                    }
                    if (text.matches("\\d{4}-\\d{2}-\\d{2}T.*Z")) {
                        try {
                            yield Instant.parse(text);
                        } catch (RuntimeException ignored) {
                            yield text;
                        }
                    }
                    yield text;
                }
                default -> null;
            };
        }

        private static Object normalize(Object value) {
            if (value instanceof UUID uuid) return uuid.toString();
            if (value instanceof Timestamp timestamp) return timestamp.toInstant().atOffset(ZoneOffset.UTC).toString();
            if (value instanceof OffsetDateTime offset) return offset.toInstant().toString();
            return value;
        }

        private static Row row(Map<String, Object> values) {
            Row.Builder builder = Row.newBuilder();
            values.forEach((key, value) -> builder.putValues(key, proto(value)));
            return builder.build();
        }

        private static Value proto(Object raw) {
            if (raw == null) return Value.newBuilder().setNullValue(NullValue.NULL_VALUE).build();
            if (raw instanceof Boolean bool) return Value.newBuilder().setBoolValue(bool).build();
            if (raw instanceof Number number) return Value.newBuilder().setNumberValue(number.doubleValue()).build();
            return Value.newBuilder().setStringValue(String.valueOf(raw)).build();
        }

        record Result(List<Map<String, Object>> rows, int affected) {}
    }
}
