package com.vn9melody.openerp.modules.plugin.data;

import com.google.protobuf.Value;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    @ConfigProperty(name = "openerp.plugin.data.default-timeout-ms", defaultValue = "3000")
    int defaultTimeoutMs;

    @ConfigProperty(name = "openerp.plugin.data.max-rows", defaultValue = "1000")
    int maxRows;

    @Transactional
    public Result execute(PluginServiceIdentity identity, String queryId, String requestId,
                          Map<String, Value> params) {
        Resolved resolved = resolve(identity);
        return executeOne(identity, resolved, queryId, requestId, params);
    }

    @Transactional
    public List<Result> executeBatch(PluginServiceIdentity identity, List<BatchStatement> statements) {
        Resolved resolved = resolve(identity);
        List<Result> results = new ArrayList<>(statements.size());
        for (BatchStatement statement : statements) {
            results.add(executeOne(identity, resolved, statement.queryId(),
                    statement.requestId(), statement.params()));
        }
        return results;
    }

    public record BatchStatement(String queryId, String requestId, Map<String, Value> params) {}

    private Result executeOne(PluginServiceIdentity identity, Resolved resolved,
                              String queryId, String requestId, Map<String, Value> params) {
        PluginManifest manifest = registry.manifest(identity.pluginKey(), resolved.version());
        PluginQueryDescriptor query = manifest.requireQuery(queryId);
        Map<String, Value> safeParams = params == null ? Map.of() : params;
        boolean tenantScoped = identity.scope() == PluginServiceIdentity.Scope.TENANT;
        PluginQueryCompiler.CompiledQuery compiled = compiler.compile(
                manifest, query, safeParams, resolved.schema(), tenantScoped);
        int timeout = query.timeoutMs() > 0 ? query.timeoutMs() : defaultTimeoutMs;
        try (Connection connection = dataSource.getConnection()) {
            configureSession(connection, resolved, timeout);
            long total = 0;
            if (compiled.countSql() != null) {
                total = count(connection, compiled);
            }
            long started = System.nanoTime();
            List<Map<String, Object>> rows = run(connection, compiled);
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

    private List<Map<String, Object>> run(Connection connection, PluginQueryCompiler.CompiledQuery compiled)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(compiled.sql())) {
            bind(statement, compiled.params());
            statement.setMaxRows(Math.max(1, maxRows) + 1);
            boolean hasRows = statement.execute();
            if (!hasRows) {
                return List.of();
            }
            try (ResultSet resultSet = statement.getResultSet()) {
                List<Map<String, Object>> rows = new ArrayList<>();
                ResultSetMetaData meta = resultSet.getMetaData();
                int columns = meta.getColumnCount();
                while (resultSet.next()) {
                    if (rows.size() >= Math.max(1, maxRows)) {
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

    private Object plain(Object value) throws SQLException {
        if (value == null) {
            return null;
        }
        if (value instanceof java.sql.Array array) {
            Object content = array.getArray();
            return content == null ? null : String.valueOf(content);
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
