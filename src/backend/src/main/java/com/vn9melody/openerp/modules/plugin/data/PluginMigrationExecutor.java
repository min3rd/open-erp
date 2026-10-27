package com.vn9melody.openerp.modules.plugin.data;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.modules.plugin.artifact.ArtifactStorage;
import com.vn9melody.openerp.modules.plugin.service.PluginSemver;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.sql.DataSource;
import org.jboss.logging.Logger;

/**
 * Runs the migrations declared by a plugin bundle and records them in the
 * tenant schema. Plugin containers no longer run Flyway or hold DDL rights.
 */
@ApplicationScoped
public class PluginMigrationExecutor {

    private static final Logger LOG = Logger.getLogger(PluginMigrationExecutor.class);
    private static final int MAX_MIGRATION_BYTES = 5 * 1024 * 1024;

    public record Migration(String version, String file, String checksum, String description) {}

    @Inject
    DataSource dataSource;

    @Inject
    ArtifactStorage artifactStorage;

    @Transactional
    public int migrate(String pluginKey, String pluginVersion, JsonNode manifest,
                       JsonNode distribution, String schema) {
        List<Migration> migrations = parse(manifest != null ? manifest.path("migrations") : null);
        if (migrations.isEmpty()) {
            return 0;
        }
        String artifactRef = distribution != null ? distribution.path("artifact_ref").asText("") : "";
        if (artifactRef.isBlank()) {
            throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                    "PLUGIN_DATA_MIGRATION_BUNDLE_MISSING");
        }
        Map<String, byte[]> files;
        try (InputStream bundle = artifactStorage.open(artifactRef)) {
            files = readBundle(bundle, migrations.stream().map(Migration::file).toList());
        } catch (IOException e) {
            throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                    "PLUGIN_DATA_MIGRATION_BUNDLE_INVALID", e);
        }
        migrations.sort(Comparator.comparing(item -> PluginSemver.Version.parse(item.version())));
        try (Connection connection = dataSource.getConnection()) {
            configureSearchPath(connection, schema);
            ensureHistory(connection, schema);
            Map<String, String> applied = applied(connection, schema);
            int count = 0;
            for (Migration migration : migrations) {
                byte[] content = files.get(migration.file());
                if (content == null) {
                    throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                            "PLUGIN_DATA_MIGRATION_FILE_MISSING:" + migration.file());
                }
                String checksum = checksum(content);
                if (!checksum.equals(migration.checksum())) {
                    throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                            "PLUGIN_DATA_MIGRATION_CHECKSUM_MISMATCH:" + migration.version());
                }
                String previous = applied.get(migration.version());
                if (previous != null) {
                    if (!previous.equals(checksum)) {
                        throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                                "PLUGIN_DATA_MIGRATION_ALREADY_APPLIED:" + migration.version());
                    }
                    continue;
                }
                apply(connection, schema, migration, content);
                count++;
            }
            LOG.infof("Plugin migrations: %s@%s applied %d migration(s) to %s",
                    pluginKey, pluginVersion, count, schema);
            return count;
        } catch (SQLException e) {
            LOG.errorf("Plugin migration failed plugin=%s version=%s schema=%s: %s",
                    pluginKey, pluginVersion, schema, e.getMessage());
            throw new PluginDataException(PluginDataException.Code.EXECUTION_FAILED,
                    "PLUGIN_DATA_MIGRATION_FAILED", e);
        }
    }

    private void configureSearchPath(Connection connection, String schema) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT set_config('search_path', ?, true)")) {
            statement.setString(1, schema + ", public");
            statement.execute();
        }
    }

    private void ensureHistory(Connection connection, String schema) throws SQLException {        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE IF NOT EXISTS " + quote(schema) + ".plugin_schema_history ("
                    + "version varchar(32) PRIMARY KEY,"
                    + "description text,"
                    + "checksum varchar(80) NOT NULL,"
                    + "installed_at timestamptz NOT NULL DEFAULT now())");
        }
    }

    private Map<String, String> applied(Connection connection, String schema) throws SQLException {
        Map<String, String> applied = new HashMap<>();
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT version, checksum FROM " + quote(schema) + ".plugin_schema_history")) {
            while (resultSet.next()) {
                applied.put(resultSet.getString(1), resultSet.getString(2));
            }
        }
        return applied;
    }

    private void apply(Connection connection, String schema, Migration migration, byte[] content)
            throws SQLException {
        String sql = new String(content, StandardCharsets.UTF_8);
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
        try (PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO " + quote(schema) + ".plugin_schema_history"
                        + " (version, description, checksum) VALUES (?, ?, ?)")) {
            statement.setString(1, migration.version());
            statement.setString(2, migration.description());
            statement.setString(3, checksum(content));
            statement.executeUpdate();
        }
    }

    static List<Migration> parse(JsonNode migrationsNode) {
        List<Migration> migrations = new ArrayList<>();
        if (migrationsNode == null || !migrationsNode.isArray()) {
            return migrations;
        }
        for (JsonNode node : migrationsNode) {
            String version = node.path("version").asText("");
            String file = node.path("file").asText("");
            String checksum = node.path("checksum").asText("");
            if (version.isBlank() || file.isBlank() || checksum.isBlank()) {
                throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                        "PLUGIN_DATA_MIGRATION_INVALID");
            }
            try {
                PluginSemver.Version.parse(version);
            } catch (IllegalArgumentException e) {
                throw new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                        "PLUGIN_DATA_MIGRATION_VERSION_INVALID:" + version);
            }
            migrations.add(new Migration(version, normalize(file), checksum,
                    node.path("description").asText("")));
        }
        return migrations;
    }

    static Map<String, byte[]> readBundle(InputStream bundle, List<String> wanted) throws IOException {
        Map<String, byte[]> files = new HashMap<>();
        try (ZipInputStream zip = new ZipInputStream(bundle)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = normalize(entry.getName());
                if (entry.isDirectory() || !wanted.contains(name)) {
                    continue;
                }
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] chunk = new byte[8192];
                int read;
                int total = 0;
                while ((read = zip.read(chunk)) > 0) {
                    total += read;
                    if (total > MAX_MIGRATION_BYTES) {
                        throw new IOException("Migration file exceeds limit: " + name);
                    }
                    buffer.write(chunk, 0, read);
                }
                files.put(name, buffer.toByteArray());
            }
        }
        return files;
    }

    static String checksum(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return "sha256:" + HexFormat.of().formatHex(digest.digest(content));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String normalize(String path) {
        String normalized = path.replace('\\', '/');
        while (normalized.startsWith("./")) {
            normalized = normalized.substring(2);
        }
        return normalized;
    }

    private static String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }
}
