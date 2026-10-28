package com.vn9melody.openerp.modules.plugin.data;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.Value;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import javax.sql.DataSource;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Executes validated plugin query descriptors against the tenant schema using
 * the core's own datasource. Plugins never receive database credentials.
 */
@ApplicationScoped
public class PluginDataExecutor {

    private static final Logger LOG = Logger.getLogger(PluginDataExecutor.class);

    public record Result(List<Map<String, Object>> rows, long affectedRows, long totalRows) {}

    @Inject
    DataSource dataSource;

    @Inject
    PluginDescriptorRegistry registry;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginQueryCompiler compiler;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "openerp.plugin.data.default-timeout-ms", defaultValue = "3000")
    int defaultTimeoutMs;

    @ConfigProperty(name = "openerp.plugin.data.max-rows", defaultValue = "1000")
    int maxRows;

    @ConfigProperty(name = "openerp.plugin.data.max-export-rows", defaultValue = "20000")
    int maxExportRows;

    @Transactional
    public Result execute(PluginServiceIdentity identity, String queryId, String requestId,
                          Map<String, Value> params) {
        return execute(identity, queryId, requestId, params, null);
    }

    @Transactional
    public Result execute(PluginServiceIdentity identity, String queryId, String requestId,
                          Map<String, Value> params, String idempotencyKey) {
        Resolved resolved = resolve(identity);
        PluginManifest manifest = registry.manifest(identity.pluginKey(), resolved.version());
        PluginQueryDescriptor query = manifest.requireQuery(queryId);
        try (Connection connection = dataSource.getConnection()) {
            configureSession(connection, resolved,
                    query.timeoutMs() > 0 ? query.timeoutMs() : defaultTimeoutMs);
            Idempotency idempotency = beginIdempotency(connection, identity, query, idempotencyKey,
                    hash(queryId + "@" + resolved.version(), params));
            if (idempotency.replay() != null) {
                return objectMapper.readValue(idempotency.replay(), Result.class);
            }
            Result result = executeOne(identity, resolved, queryId, requestId, params, connection);
            finishIdempotency(connection, idempotency, result);
            return result;
        } catch (SQLException e) {
            LOG.errorf("plugin-data execution failed plugin=%s tenant=%s query=%s: %s",
                    identity.pluginKey(), identity.tenantId(), queryId, e.getMessage());
            throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                    "PLUGIN_DATA_EXECUTION_FAILED", e);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                    "PLUGIN_DATA_IDEMPOTENCY_FAILED", e);
        }
    }

    @Transactional
    public List<Result> executeBatch(PluginServiceIdentity identity, List<BatchStatement> statements) {
        return executeBatch(identity, statements, null);
    }

    @Transactional
    public List<Result> executeBatch(PluginServiceIdentity identity, List<BatchStatement> statements,
                                     String idempotencyKey) {
        Resolved resolved = resolve(identity);
        try (Connection connection = dataSource.getConnection()) {
            configureSession(connection, resolved, batchTimeout(identity, resolved, statements));
            String hash = hash("__batch__@" + resolved.version(), statements);
            Idempotency idempotency = beginBatchIdempotency(connection, identity, idempotencyKey, hash);
            if (idempotency.replay() != null) {
                return objectMapper.readValue(idempotency.replay(), new TypeReference<List<Result>>() {});
            }
            List<Result> results = new ArrayList<>(statements.size());
            for (BatchStatement statement : statements) {
                results.add(executeOne(identity, resolved, statement.queryId(),
                        statement.requestId(), statement.params(), connection));
            }
            finishBatchIdempotency(connection, idempotency, results);
            return results;
        } catch (SQLException e) {
            throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                    "PLUGIN_DATA_EXECUTION_FAILED", e);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                    "PLUGIN_DATA_IDEMPOTENCY_FAILED", e);
        }
    }

    public record BatchStatement(String queryId, String requestId, Map<String, Value> params) {}

    /** A batch runs with the largest timeout declared by its statements. */
    private int batchTimeout(PluginServiceIdentity identity, Resolved resolved, List<BatchStatement> statements) {
        PluginManifest manifest = registry.manifest(identity.pluginKey(), resolved.version());
        int timeout = defaultTimeoutMs;
        for (BatchStatement statement : statements) {
            PluginQueryDescriptor query = manifest.requireQuery(statement.queryId());
            if (query.timeoutMs() > timeout) {
                timeout = query.timeoutMs();
            }
        }
        return timeout;
    }

    private Result executeOne(PluginServiceIdentity identity, Resolved resolved,
                              String queryId, String requestId, Map<String, Value> params,
                              Connection connection) {        PluginManifest manifest = registry.manifest(identity.pluginKey(), resolved.version());
        PluginQueryDescriptor query = manifest.requireQuery(queryId);
        if (!identity.system() && query.scope() == PluginQueryDescriptor.Scope.SYSTEM) {
            throw new PluginDataException(PluginDataException.Code.QUERY_NOT_FOUND,
                    "PLUGIN_DATA_QUERY_SYSTEM_SCOPE_DENIED");
        }
        Map<String, Value> safeParams = params == null ? Map.of() : params;
        PluginQueryDescriptor.Scope scope = identity.system()
                ? PluginQueryDescriptor.Scope.SYSTEM
                : query.scope();
        PluginQueryCompiler.CompiledQuery compiled = compiler.compile(
                manifest, query, safeParams, resolved.schema(), scope);
        try {
            long total = 0;
            if (compiled.countSql() != null) {
                total = count(connection, compiled);
            }
            long started = System.nanoTime();
            int rowLimit = query.bulk() ? Math.max(1, maxExportRows) : Math.max(1, maxRows);
            List<Map<String, Object>> rows = run(connection, compiled, rowLimit);
            long affected = query.mode() == PluginQueryDescriptor.Mode.WRITE ? rows.size() : 0;
            long durationMs = (System.nanoTime() - started) / 1_000_000;
            LOG.debugf("plugin-data %s %s tenant=%s query=%s rows=%d total=%d durationMs=%d requestId=%s",
                    query.mode(), identity.pluginKey(), identity.tenantId(), queryId,
                    rows.size(), total, durationMs, requestId);
            return new Result(rows, affected, total);
        } catch (SQLException e) {
            LOG.errorf("plugin-data execution failed plugin=%s tenant=%s query=%s: %s",
                    identity.pluginKey(), identity.tenantId(), queryId, e.getMessage());
            throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                    "PLUGIN_DATA_EXECUTION_FAILED", e);
        }
    }

    private void configureSession(Connection connection, Resolved resolved, int timeoutMs)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT set_config('search_path', ?, true),"
                        + " set_config('app.tenant_id', ?, true),"
                        + " set_config('statement_timeout', ?, true)")) {
            statement.setString(1, resolved.schema() + ", public");
            statement.setString(2, resolved.tenantId().toString());
            statement.setString(3, String.valueOf(timeoutMs));
            statement.execute();
        }
    }

    private long count(Connection connection, PluginQueryCompiler.CompiledQuery compiled)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(compiled.countSql())) {
            bind(statement, compiled.countParams());
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? resultSet.getLong(1) : 0;
            }
        }
    }

    private List<Map<String, Object>> run(Connection connection, PluginQueryCompiler.CompiledQuery compiled,
                                          int rowLimit) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(compiled.sql())) {
            bind(statement, compiled.params());
            statement.setMaxRows(rowLimit + 1);
            boolean hasRows = statement.execute();
            if (!hasRows) {
                return List.of();
            }
            try (ResultSet resultSet = statement.getResultSet()) {
                List<Map<String, Object>> rows = new ArrayList<>();
                ResultSetMetaData meta = resultSet.getMetaData();
                int columns = meta.getColumnCount();
                while (resultSet.next()) {
                    if (rows.size() >= rowLimit) {
                        throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                                "PLUGIN_DATA_ROW_LIMIT_EXCEEDED");
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int index = 1; index <= columns; index++) {
                        row.put(meta.getColumnLabel(index), plain(resultSet.getObject(index)));
                    }
                    rows.add(row);
                }
                return rows;
            }
        }
    }

    private void bind(PreparedStatement statement, List<Object> params) throws SQLException {
        for (int index = 0; index < params.size(); index++) {
            Object value = params.get(index);
            int jdbc = index + 1;
            if (value == null) {
                statement.setNull(jdbc, java.sql.Types.NULL);
            } else if (value instanceof PluginQueryCompiler.ArrayValue array) {
                statement.setArray(jdbc, statement.getConnection().createArrayOf(
                        array.sqlType(), array.values().toArray()));
            } else if (value instanceof UUID uuid) {
                statement.setObject(jdbc, uuid);
            } else if (value instanceof List<?> list) {
                statement.setArray(jdbc, statement.getConnection().createArrayOf("text",
                        list.toArray()));
            } else {
                statement.setObject(jdbc, value);
            }
        }
    }

    private record Idempotency(boolean active, String replay, String pluginKey, UUID tenantId, String key) {}

    private Idempotency beginIdempotency(Connection connection, PluginServiceIdentity identity,
                                         PluginQueryDescriptor query, String key, String hash)
            throws SQLException {
        if (query.mode() != PluginQueryDescriptor.Mode.WRITE || key == null || key.isBlank()) {
            return new Idempotency(false, null, null, null, null);
        }
        return beginIdempotency(connection, identity, key, hash);
    }

    private Idempotency beginBatchIdempotency(Connection connection, PluginServiceIdentity identity,
                                              String key, String hash) throws SQLException {
        if (key == null || key.isBlank()) {
            return new Idempotency(false, null, null, null, null);
        }
        return beginIdempotency(connection, identity, key, hash);
    }

    private Idempotency beginIdempotency(Connection connection, PluginServiceIdentity identity,
                                         String key, String hash) throws SQLException {
        if (key.length() > 128) {
            throw new PluginDataException(PluginDataException.Code.PARAM_INVALID,
                    "PLUGIN_DATA_IDEMPOTENCY_KEY_INVALID");
        }
        try (PreparedStatement insert = connection.prepareStatement(
                "INSERT INTO plugin_data_idempotency"
                        + " (plugin_key, tenant_id, idem_key, request_hash)"
                        + " VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING")) {
            insert.setString(1, identity.pluginKey());
            insert.setObject(2, identity.tenantId());
            insert.setString(3, key);
            insert.setString(4, hash);
            if (insert.executeUpdate() == 1) {
                return new Idempotency(true, null, identity.pluginKey(), identity.tenantId(), key);
            }
        }
        try (PreparedStatement select = connection.prepareStatement(
                "SELECT request_hash, response_json FROM plugin_data_idempotency"
                        + " WHERE plugin_key = ? AND tenant_id = ? AND idem_key = ?")) {
            select.setString(1, identity.pluginKey());
            select.setObject(2, identity.tenantId());
            select.setString(3, key);
            try (ResultSet result = select.executeQuery()) {
                if (!result.next()) {
                    throw new PluginDataException(PluginDataException.Code.IDEMPOTENCY_IN_PROGRESS,
                            "PLUGIN_DATA_IDEMPOTENCY_IN_PROGRESS");
                }
                if (!hash.equals(result.getString("request_hash"))) {
                    throw new PluginDataException(PluginDataException.Code.IDEMPOTENCY_CONFLICT,
                            "PLUGIN_DATA_IDEMPOTENCY_CONFLICT");
                }
                String replay = result.getString("response_json");
                if (replay == null) {
                    throw new PluginDataException(PluginDataException.Code.IDEMPOTENCY_IN_PROGRESS,
                            "PLUGIN_DATA_IDEMPOTENCY_IN_PROGRESS");
                }
                return new Idempotency(false, replay, identity.pluginKey(), identity.tenantId(), key);
            }
        }
    }

    private void finishIdempotency(Connection connection, Idempotency idempotency, Result result)
            throws SQLException, com.fasterxml.jackson.core.JsonProcessingException {
        if (idempotency.active()) {
            storeIdempotency(connection, idempotency, objectMapper.writeValueAsString(result));
        }
    }

    private void finishBatchIdempotency(Connection connection, Idempotency idempotency,
                                        List<Result> results)
            throws SQLException, com.fasterxml.jackson.core.JsonProcessingException {
        if (idempotency.active()) {
            storeIdempotency(connection, idempotency, objectMapper.writeValueAsString(results));
        }
    }

    private void storeIdempotency(Connection connection, Idempotency idempotency, String json)
            throws SQLException {
        // The row key is written by beginIdempotency; only the response is updated here.
        try (PreparedStatement update = connection.prepareStatement(
                "UPDATE plugin_data_idempotency SET response_json = CAST(? AS jsonb)"
                        + " WHERE plugin_key = ? AND tenant_id = ? AND idem_key = ?")) {
            update.setString(1, json);
            update.setString(2, idempotency.pluginKey());
            update.setObject(3, idempotency.tenantId());
            update.setString(4, idempotency.key());
            update.executeUpdate();
        }
    }

    private static String hash(String queryId, Map<String, Value> params) {
        Map<String, String> sorted = new TreeMap<>();
        if (params != null) {
            params.forEach((key, value) -> sorted.put(key, String.valueOf(value)));
        }
        return sha256(queryId + "|" + sorted);
    }

    private static String hash(String queryId, List<BatchStatement> statements) {
        StringBuilder value = new StringBuilder(queryId);
        for (BatchStatement statement : statements) {
            value.append('|').append(statement.queryId()).append('=');
            if (statement.params() != null) {
                new TreeMap<>(statement.params()).forEach((key, param) ->
                        value.append(key).append(':').append(String.valueOf(param)).append(','));
            }
        }
        return sha256(value.toString());
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private Object plain(Object value) throws SQLException {        if (value == null) {
            return null;
        }
        if (value instanceof java.sql.Array array) {
            Object content = array.getArray();
            if (content instanceof Object[] items) {
                List<String> values = new ArrayList<>(items.length);
                for (Object item : items) {
                    values.add(item == null ? null : String.valueOf(item));
                }
                return values;
            }
            return content == null ? null : String.valueOf(content);
        }
        if (value instanceof java.time.OffsetDateTime dateTime) {
            return dateTime.toInstant().toString();
        }
        if (value instanceof java.time.LocalDateTime dateTime) {
            return dateTime.toInstant(java.time.ZoneOffset.UTC).toString();
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant().toString();
        }
        if (value instanceof java.time.Instant instant) {
            return instant.toString();
        }
        if (value instanceof java.time.LocalDate date) {
            return date.toString();
        }
        if (value instanceof java.time.OffsetTime time) {
            return time.toString();
        }
        if (value instanceof byte[] bytes) {
            return Base64.getEncoder().encodeToString(bytes);
        }
        if (value instanceof Number || value instanceof Boolean || value instanceof String) {
            return value;
        }
        return String.valueOf(value);
    }

    private Resolved resolve(PluginServiceIdentity identity) {
        TenantPlugin ledger = tenantPluginRepository
                .findByTenantAndKey(identity.tenantId(), identity.pluginKey())
                .orElseThrow(() -> new PluginDataException(PluginDataException.Code.PLUGIN_NOT_ACTIVE,
                        "PLUGIN_DATA_PLUGIN_NOT_INSTALLED"));
        if (ledger.status != TenantPluginStatus.ACTIVE) {
            throw new PluginDataException(PluginDataException.Code.PLUGIN_NOT_ACTIVE,
                    "PLUGIN_DATA_PLUGIN_NOT_ACTIVE");
        }
        if (ledger.storageSchema == null || ledger.storageSchema.isBlank()) {
            throw new PluginDataException(PluginDataException.Code.PLUGIN_NOT_ACTIVE,
                    "PLUGIN_DATA_SCHEMA_MISSING");
        }
        if (ledger.installedVersion == null || ledger.installedVersion.isBlank()) {
            throw new PluginDataException(PluginDataException.Code.PLUGIN_NOT_ACTIVE,
                    "PLUGIN_DATA_VERSION_MISSING");
        }
        return new Resolved(ledger.storageSchema, identity.tenantId(), ledger.installedVersion);
    }

    private record Resolved(String schema, UUID tenantId, String version) {}
}
