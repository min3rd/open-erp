package com.vn9melody.openerp.modules.plugin.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.modules.plugin.artifact.ArtifactStorage;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * TASK-402 P2: core applies plugin migration bundles with checksum validation
 * and history tracking; plugin containers never run Flyway.
 */
@QuarkusTest
public class PluginMigrationExecutorTest {

    @Inject
    PluginMigrationExecutor executor;

    @Inject
    EntityManager em;

    @Inject
    ObjectMapper objectMapper;

    @InjectMock
    ArtifactStorage artifactStorage;

    private String schema;
    private String pluginKey;

    @BeforeEach
    @Transactional
    void setUp() {
        String suffix = Long.toHexString(System.nanoTime());
        pluginKey = "mig-test-" + suffix;
        schema = "tenant_mig_" + suffix;
        em.createNativeQuery("CREATE SCHEMA " + schema).executeUpdate();
    }

    @AfterEach
    @Transactional
    void tearDown() {
        em.createNativeQuery("DROP SCHEMA IF EXISTS " + schema + " CASCADE").executeUpdate();
    }

    @Test
    @Transactional
    void appliesBundleInVersionOrderAndIsIdempotent() throws Exception {
        byte[] v1 = "CREATE TABLE items (id uuid PRIMARY KEY, code text NOT NULL);"
                .getBytes(StandardCharsets.UTF_8);
        byte[] v2 = ("ALTER TABLE items ADD COLUMN name text;\n"
                + "CREATE INDEX idx_items_code ON items (code);")
                .getBytes(StandardCharsets.UTF_8);
        byte[] bundle = zip(Map.of(
                "db/plugin-migration/V1.0.0__initial.sql", v1,
                "db/plugin-migration/V1.1.0__name.sql", v2));
        when(artifactStorage.open("bundle/test.zip"))
                .thenAnswer(invocation -> new ByteArrayInputStream(bundle));

        JsonNode manifest = objectMapper.readTree(objectMapper.writeValueAsString(Map.of(
                "migrations", java.util.List.of(
                        migration("1.1.0", "db/plugin-migration/V1.1.0__name.sql", v2),
                        migration("1.0.0", "db/plugin-migration/V1.0.0__initial.sql", v1)))));
        JsonNode distribution = objectMapper.readTree("{\"artifact_ref\":\"bundle/test.zip\"}");

        int applied = executor.migrate(pluginKey, "1.1.0", manifest, distribution, schema);
        assertEquals(2, applied);

        Number tables = (Number) em.createNativeQuery(
                        "SELECT count(*) FROM information_schema.tables WHERE table_schema = ?1")
                .setParameter(1, schema).getSingleResult();
        assertEquals(2, tables.intValue());

        int again = executor.migrate(pluginKey, "1.1.0", manifest, distribution, schema);
        assertEquals(0, again);

        Number history = (Number) em.createNativeQuery(
                        "SELECT count(*) FROM " + schema + ".plugin_schema_history")
                .getSingleResult();
        assertEquals(2, history.intValue());
    }

    @Test
    void rejectsChecksumMismatchBeforeApplying() throws Exception {
        byte[] sql = "CREATE TABLE broken (id uuid PRIMARY KEY);".getBytes(StandardCharsets.UTF_8);
        byte[] bundle = zip(Map.of("db/V1.0.0__broken.sql", sql));
        when(artifactStorage.open("bundle/bad.zip")).thenReturn(new ByteArrayInputStream(bundle));

        JsonNode manifest = objectMapper.readTree(objectMapper.writeValueAsString(Map.of(
                "migrations", java.util.List.of(Map.of(
                        "version", "1.0.0",
                        "file", "db/V1.0.0__broken.sql",
                        "checksum", "sha256:0000")))));
        JsonNode distribution = objectMapper.readTree("{\"artifact_ref\":\"bundle/bad.zip\"}");

        PluginDataException error = assertThrows(PluginDataException.class,
                () -> executor.migrate(pluginKey, "1.0.0", manifest, distribution, schema));
        assertEquals(PluginDataException.Code.INVALID_QUERY, error.code());
    }

    private Map<String, String> migration(String version, String file, byte[] sql) {
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("version", version);
        entry.put("file", file);
        entry.put("checksum", PluginMigrationExecutor.checksum(sql));
        entry.put("description", "test " + version);
        return entry;
    }

    private static byte[] zip(Map<String, byte[]> entries) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output)) {
            for (Map.Entry<String, byte[]> entry : entries.entrySet()) {
                zip.putNextEntry(new ZipEntry(entry.getKey()));
                zip.write(entry.getValue());
                zip.closeEntry();
            }
        }
        return output.toByteArray();
    }
}
