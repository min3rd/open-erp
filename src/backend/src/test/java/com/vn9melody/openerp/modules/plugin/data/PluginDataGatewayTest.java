package com.vn9melody.openerp.modules.plugin.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.Value;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.plugin.data.v1.ExecuteRequest;
import com.vn9melody.openerp.plugin.data.v1.ExecuteResponse;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.grpc.Context;
import io.grpc.Metadata;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * TASK-402 P2: descriptor registry + query compiler + tenant-scoped execution
 * against the real PostgreSQL test database (no H2).
 */
@QuarkusTest
public class PluginDataGatewayTest {

    private static final String VERSION = "1.0.0";

    @Inject
    EntityManager em;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    PluginDataExecutor executor;

    @Inject
    @io.quarkus.grpc.GrpcService
    PluginDataGrpcService grpcService;

    @Inject
    JwtTokenService jwtTokenService;

    private UUID tenantId;
    private UUID otherTenantId;
    private UUID catalogId;
    private String pluginKey;
    private String schema;

    @BeforeEach
    @Transactional
    void setUp() throws Exception {
        String suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        otherTenantId = S2EngineFixtures.insertTenant(em, suffix + "-other");
        pluginKey = "data-gw-" + suffix;
        schema = "tenant_" + tenantId.toString().replace("-", "").substring(0, 8) + "_data_gw";
        catalogId = UUID.randomUUID();

        em.createNativeQuery("""
                        INSERT INTO plugin_catalog (id, plugin_key, name_key, description_key, visibility)
                        VALUES (?1, ?2, 'DATA_GW_NAME', 'DATA_GW_DESCRIPTION', 'PLATFORM')
                        """)
                .setParameter(1, catalogId)
                .setParameter(2, pluginKey)
                .executeUpdate();

        String manifest = objectMapper.writeValueAsString(objectMapper.readTree("""
                {
                  "entities": [
                    {"name":"Thing","table":"things","storage_scope":"TENANT",
                     "public_fields":["id","tenant_id","code","name","status","kind_id"],
                     "relations":[{"name":"kind","target_entity":"Kind","type":"many_to_one",
                                   "local_field":"kind_id","target_field":"id"}]},
                    {"name":"Kind","table":"kinds","storage_scope":"TENANT",
                     "public_fields":["id","tenant_id","code","name"]}
                  ],
                  "queries": [
                    {"id":"test.things.page","mode":"READ","operation":"LIST","entity":"Thing",
                     "select":["id","code","name","status"],
                     "filters":[
                       {"field":"status","op":"EQ","param":"status"},
                       {"field":"name","op":"ILIKE","param":"q","match":"CONTAINS"}
                     ],
                     "sort":[{"field":"code","direction":"ASC"}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10},
                     "maxRows":50,"timeoutMs":2000},
                    {"id":"test.things.get","mode":"READ","operation":"GET","entity":"Thing",
                     "select":["id","code","name","status"],
                     "filters":[{"field":"id","op":"EQ","param":"id","required":true}]},
                    {"id":"test.things.insert","mode":"WRITE","operation":"INSERT","entity":"Thing",
                     "values":{"code":{"param":"code"},"name":{"param":"name"},"status":{"param":"status"}},
                     "returning":["id","code","name","status"]},
                    {"id":"test.things.update","mode":"WRITE","operation":"UPDATE","entity":"Thing",
                     "values":{"name":{"param":"name"}},
                     "filters":[{"field":"id","op":"EQ","param":"id","required":true}],
                     "returning":["id","name"]},
                    {"id":"test.things.delete","mode":"WRITE","operation":"DELETE","entity":"Thing",
                     "filters":[{"field":"id","op":"EQ","param":"id","required":true}],
                     "returning":["id"]},
                    {"id":"test.things.with.kind","mode":"READ","operation":"LIST","entity":"Thing",
                     "select":["id","code"],
                     "joins":[{"relation":"kind","select":["code","name"]}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10}},
                    {"id":"test.things.by.status","mode":"READ","operation":"LIST","entity":"Thing",
                     "select":["id","code"],
                     "filters":[{"field":"status","op":"IN","param":"statuses","required":true}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10}}
                  ]
                }
                """));

        em.createNativeQuery("""
                        INSERT INTO plugin_versions
                            (id, catalog_id, version, release_status, core_compatibility, manifest, published_at)
                        VALUES (gen_random_uuid(), ?1, ?2, 'PUBLISHED', '>=1.0.0 <2.0.0', CAST(?3 AS jsonb), now())
                        """)
                .setParameter(1, catalogId)
                .setParameter(2, VERSION)
                .setParameter(3, manifest)
                .executeUpdate();

        em.createNativeQuery("""
                        INSERT INTO tenant_plugins
                            (id, tenant_id, catalog_id, plugin_key, status, installed_version, storage_schema)
                        VALUES (gen_random_uuid(), ?1, ?2, ?3, 'ACTIVE', ?4, ?5)
                        """)
                .setParameter(1, tenantId)
                .setParameter(2, catalogId)
                .setParameter(3, pluginKey)
                .setParameter(4, VERSION)
                .setParameter(5, schema)
                .executeUpdate();

        em.createNativeQuery("CREATE SCHEMA " + schema).executeUpdate();
        em.createNativeQuery("CREATE TABLE " + schema + ".kinds ("
                + "id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,"
                + "code text NOT NULL, name text NOT NULL)").executeUpdate();
        em.createNativeQuery("CREATE TABLE " + schema + ".things ("
                + "id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,"
                + "code text NOT NULL, name text NOT NULL, status text NOT NULL, kind_id uuid)").executeUpdate();

        UUID kindId = UUID.randomUUID();
        em.createNativeQuery("INSERT INTO " + schema + ".kinds (id, tenant_id, code, name) VALUES (?1, ?2, 'K1', 'Kind one')")
                .setParameter(1, kindId).setParameter(2, tenantId).executeUpdate();
        em.createNativeQuery("INSERT INTO " + schema + ".things (tenant_id, code, name, status, kind_id) "
                        + "VALUES (?1, 'B', 'Beta', 'ACTIVE', ?2)")
                .setParameter(1, tenantId).setParameter(2, kindId).executeUpdate();
        em.createNativeQuery("INSERT INTO " + schema + ".things (tenant_id, code, name, status) "
                        + "VALUES (?1, 'A', 'Alpha', 'ACTIVE')")
                .setParameter(1, tenantId).executeUpdate();
        em.createNativeQuery("INSERT INTO " + schema + ".things (tenant_id, code, name, status) "
                        + "VALUES (?1, 'X', 'Other tenant', 'ACTIVE')")
                .setParameter(1, otherTenantId).executeUpdate();
    }

    @AfterEach
    @Transactional
    void tearDown() {
        em.createNativeQuery("DROP SCHEMA IF EXISTS " + schema + " CASCADE").executeUpdate();
        em.createNativeQuery("DELETE FROM tenant_plugins WHERE plugin_key = ?1")
                .setParameter(1, pluginKey).executeUpdate();
        em.createNativeQuery("DELETE FROM plugin_versions WHERE catalog_id = ?1")
                .setParameter(1, catalogId).executeUpdate();
        em.createNativeQuery("DELETE FROM plugin_catalog WHERE id = ?1")
                .setParameter(1, catalogId).executeUpdate();
        em.createNativeQuery("DELETE FROM tenants WHERE id IN (?1, ?2)")
                .setParameter(1, tenantId).setParameter(2, otherTenantId).executeUpdate();
    }

    @Test
    void listsOnlyTenantRowsAndCounts() {
        PluginDataExecutor.Result result = executor.execute(identity(), "test.things.page", "req-1",
                Map.of("status", string("ACTIVE")));
        assertEquals(2, result.rows().size());
        assertEquals(2, result.totalRows());
        assertTrue(result.rows().stream().noneMatch(row -> "X".equals(row.get("code"))));
        assertEquals("A", result.rows().get(0).get("code"));
    }

    @Test
    void filtersContainAndPagination() {
        PluginDataExecutor.Result result = executor.execute(identity(), "test.things.page", "req-2",
                Map.of("status", string("ACTIVE"), "q", string("Bet")));
        assertEquals(1, result.rows().size());
        assertEquals("B", result.rows().get(0).get("code"));
    }

    @Test
    void insertsTenantIdAutomatically() {
        PluginDataExecutor.Result inserted = executor.execute(identity(), "test.things.insert", "req-3",
                Map.ofEntries(named("code", "C"), named("name", "Gamma"), named("status", "ACTIVE")));
        assertEquals(1, inserted.affectedRows());
        String id = String.valueOf(inserted.rows().get(0).get("id"));

        PluginDataExecutor.Result fetched = executor.execute(identity(), "test.things.get", "req-4",
                Map.ofEntries(named("id", id)));
        assertEquals(1, fetched.rows().size());
        assertEquals("Gamma", fetched.rows().get(0).get("name"));
    }

    @Test
    @Transactional
    void updateAndDeleteOnlyOwnRows() {
        String otherId = String.valueOf(em.createNativeQuery(
                        "SELECT id FROM " + schema + ".things WHERE tenant_id = ?1")
                .setParameter(1, otherTenantId).getSingleResult());
        PluginDataExecutor.Result foreignUpdate = executor.execute(identity(), "test.things.update", "req-5",
                Map.ofEntries(named("id", otherId), named("name", "Hacked")));
        assertEquals(0, foreignUpdate.affectedRows());

        String ownId = String.valueOf(em.createNativeQuery(
                        "SELECT id FROM " + schema + ".things WHERE code = 'A'")
                .getSingleResult());
        PluginDataExecutor.Result update = executor.execute(identity(), "test.things.update", "req-6",
                Map.ofEntries(named("id", ownId), named("name", "Alpha 2")));
        assertEquals(1, update.affectedRows());

        PluginDataExecutor.Result delete = executor.execute(identity(), "test.things.delete", "req-7",
                Map.ofEntries(named("id", ownId)));
        assertEquals(1, delete.affectedRows());
    }

    @Test
    void joinsDeclaredRelation() {
        PluginDataExecutor.Result result = executor.execute(identity(), "test.things.with.kind", "req-8",
                Map.of());
        assertEquals(2, result.rows().size());
        Map<String, Object> row = result.rows().stream()
                .filter(item -> "B".equals(item.get("code"))).findFirst().orElseThrow();
        assertEquals("K1", row.get("kind_code"));
        assertEquals("Kind one", row.get("kind_name"));
    }

    @Test
    void batchRunsInOneTransaction() {
        List<PluginDataExecutor.Result> results = executor.executeBatch(identity(), List.of(
                new PluginDataExecutor.BatchStatement("test.things.insert", "batch-1",
                        Map.ofEntries(named("code", "D"), named("name", "Delta"), named("status", "ACTIVE"))),
                new PluginDataExecutor.BatchStatement("test.things.page", "batch-2",
                        Map.of("status", string("ACTIVE")))));
        assertEquals(2, results.size());
        assertEquals(3, results.get(1).totalRows());
    }

    @Test
    void rejectsMissingParameterAndUnknownQuery() {
        PluginDataException missing = org.junit.jupiter.api.Assertions.assertThrows(
                PluginDataException.class, () -> executor.execute(identity(), "test.things.by.status", "req-9",
                        Map.of()));
        assertEquals(PluginDataException.Code.PARAM_MISSING, missing.code());

        PluginDataException unknown = org.junit.jupiter.api.Assertions.assertThrows(
                PluginDataException.class, () -> executor.execute(identity(), "nope", "req-10", Map.of()));
        assertEquals(PluginDataException.Code.QUERY_NOT_FOUND, unknown.code());
    }

    @Test
    void grpcExecuteUsesServiceTokenAndReturnsRows() {
        String token = jwtTokenService.generatePluginServiceToken(tenantId, pluginKey, "TENANT",
                Duration.ofMinutes(5));
        Metadata metadata = new Metadata();
        metadata.put(PluginServiceIdentityResolver.SERVICE_TOKEN, token);
        Context context = Context.current()
                .withValue(PluginDataMetadataInterceptor.METADATA, metadata);
        ExecuteRequest request = ExecuteRequest.newBuilder()
                .setQueryId("test.things.page")
                .setRequestId("grpc-1")
                .putParams("status", string("ACTIVE"))
                .build();
        Capture<ExecuteResponse> capture = new Capture<>();
        context.run(() -> grpcService.execute(request, capture));
        assertNull(capture.error);
        assertNotNull(capture.value);
        assertEquals(2, capture.value.getRowsCount());
        assertEquals("PLUGIN_DATA_SUCCESS", capture.value.getCode());
    }

    @Test
    void grpcRejectsRequestWithoutToken() {
        Metadata metadata = new Metadata();
        Context context = Context.current()
                .withValue(PluginDataMetadataInterceptor.METADATA, metadata);
        ExecuteRequest request = ExecuteRequest.newBuilder().setQueryId("test.things.page").build();
        Capture<ExecuteResponse> capture = new Capture<>();
        context.run(() -> grpcService.execute(request, capture));
        assertNotNull(capture.error);
        assertEquals(io.grpc.Status.Code.PERMISSION_DENIED,
                io.grpc.Status.fromThrowable(capture.error).getCode());
    }

    private PluginServiceIdentity identity() {
        return new PluginServiceIdentity(pluginKey, tenantId, PluginServiceIdentity.Scope.TENANT);
    }

    private static Value string(String value) {
        return Value.newBuilder().setStringValue(value).build();
    }

    private static Map.Entry<String, Value> named(String key, String value) {
        return Map.entry(key, string(value));
    }

    private static final class Capture<T> implements StreamObserver<T> {
        private T value;
        private Throwable error;

        @Override
        public void onNext(T value) {
            this.value = value;
        }

        @Override
        public void onError(Throwable throwable) {
            this.error = throwable;
        }

        @Override
        public void onCompleted() {
        }
    }
}
