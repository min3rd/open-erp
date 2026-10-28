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
                     "public_fields":["id","tenant_id","code","name","status","kind_id","valid_from","valid_to","note","tags"],
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
                       {"field":"valid_to","op":"IS_NULL"}
                     ],
                     "search":[{"param":"q","fields":["code","name"]}],
                     "sort":[{"field":"code","direction":"ASC"}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10},
                     "maxRows":50,"timeoutMs":2000},
                    {"id":"test.things.get","mode":"READ","operation":"GET","entity":"Thing",
                     "select":["id","code","name","status"],
                     "filters":[{"field":"id","op":"EQ","param":"id","required":true}]},
                    {"id":"test.things.insert","mode":"WRITE","operation":"INSERT","entity":"Thing",
                     "values":{"code":{"param":"code"},"name":{"param":"name"},"status":{"param":"status"}},
                     "returning":["id","code","name","status"]},
                    {"id":"test.things.insert.optional","mode":"WRITE","operation":"INSERT","entity":"Thing",
                     "values":{
                       "code":{"param":"code"},
                       "name":{"param":"name"},
                       "status":{"param":"status"},
                       "note":{"param":"note","optional":true,"allow_null":true},
                       "tags":{"param":"tags","optional":true,"type":"text[]"}
                     },
                     "returning":["id","code","name","status","note","tags"]},
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
                     "filters":[{"field":"valid_to","op":"IS_NULL"}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10}},
                    {"id":"test.things.by.status","mode":"READ","operation":"LIST","entity":"Thing",
                     "select":["id","code"],
                     "filters":[{"field":"status","op":"IN","param":"statuses","required":true}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10}},
                    {"id":"test.things.visible","mode":"READ","operation":"LIST","entity":"Thing",
                     "tenant_scope":"TENANT_OR_SYSTEM",
                     "select":["id","code","name"],
                     "filters":[{"field":"valid_to","op":"IS_NULL"}],
                     "sort":[{"field":"code","direction":"ASC"}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10}},
                    {"id":"test.things.effective","mode":"READ","operation":"LIST","entity":"Thing",
                     "select":["id","code"],
                     "filters":[{"field":"valid_from","op":"EFFECTIVE_AT","param":"as_of","required":true}],
                     "sort":[{"field":"code","direction":"ASC"}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10}},
                    {"id":"test.things.merged","mode":"READ","operation":"MERGED_LIST","entity":"Thing",
                     "tenant_scope":"TENANT_OR_SYSTEM",
                     "merge_key":"code",
                     "select":["id","code","name","status"],
                     "filters":[{"field":"valid_from","op":"EFFECTIVE_AT","param":"as_of","required":true}],
                     "post_filters":[{"field":"status","op":"EQ","value":"ACTIVE"}],
                     "page":{"pageParam":"page","sizeParam":"size","maxSize":50,"defaultSize":10}},
                    {"id":"test.things.by.kind.code","mode":"READ","operation":"LIST","entity":"Thing",
                     "select":["id","code","kind_id"],
                     "exists":[{"entity":"Kind","local_field":"kind_id","remote_field":"id",
                                "filter_field":"code","param":"kind_code","tenant_scope":"TENANT_OR_SYSTEM"}],
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
                + "id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid,"
                + "code text NOT NULL, name text NOT NULL, status text NOT NULL, kind_id uuid,"
                + "valid_from timestamptz NOT NULL DEFAULT now(), valid_to timestamptz,"
                + "note text, tags text[])").executeUpdate();

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
        em.createNativeQuery("INSERT INTO " + schema + ".things (tenant_id, code, name, status) "
                        + "VALUES (NULL, 'S', 'System row', 'ACTIVE')").executeUpdate();
        em.createNativeQuery("INSERT INTO " + schema + ".things (tenant_id, code, name, status, valid_from, valid_to) "
                        + "VALUES (?1, 'E', 'Expired', 'ACTIVE', now() - interval '10 days', now() - interval '1 day')")
                .setParameter(1, tenantId).executeUpdate();
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

        PluginDataExecutor.Result byCode = executor.execute(identity(), "test.things.page", "req-2b",
                Map.of("q", string("Alp")));
        assertEquals(1, byCode.rows().size());
        assertEquals("A", byCode.rows().get(0).get("code"));
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
    void tenantOrSystemIncludesSystemRowsOnly() {
        PluginDataExecutor.Result result = executor.execute(identity(), "test.things.visible", "req-11",
                Map.of());
        assertEquals(3, result.rows().size());
        assertEquals(List.of("A", "B", "S"), result.rows().stream()
                .map(row -> row.get("code")).toList());
    }

    @Test
    void effectiveAtExcludesClosedVersions() {
        PluginDataExecutor.Result current = executor.execute(identity(), "test.things.effective", "req-12",
                Map.of("as_of", string(java.time.Instant.now().toString())));
        assertEquals(2, current.rows().size());
        assertEquals(List.of("A", "B"), current.rows().stream()
                .map(row -> row.get("code")).toList());

        PluginDataExecutor.Result past = executor.execute(identity(), "test.things.effective", "req-13",
                Map.of("as_of", string(java.time.Instant.now().minusSeconds(5 * 86400).toString())));
        assertEquals(1, past.rows().size());
        assertEquals("E", past.rows().get(0).get("code"));
    }

    @Test
    @Transactional
    void mergedListPrefersTenantRowEvenWhenInactive() {
        em.createNativeQuery("INSERT INTO " + schema + ".things (tenant_id, code, name, status, valid_from) "
                        + "VALUES (?1, 'S', 'Tenant hides system', 'INACTIVE', now() - interval '1 minute')")
                .setParameter(1, tenantId).executeUpdate();

        PluginDataExecutor.Result result = executor.execute(identity(), "test.things.merged", "req-14",
                Map.of("as_of", string(java.time.Instant.now().toString())));
        assertEquals(2, result.rows().size());
        assertEquals(2, result.totalRows());
        assertEquals(List.of("A", "B"), result.rows().stream()
                .map(row -> row.get("code")).toList());
    }

    @Test
    void existsFilterUsesDeclaredRelation() {
        PluginDataExecutor.Result result = executor.execute(identity(), "test.things.by.kind.code", "req-15",
                Map.of("kind_code", string("K1")));
        assertEquals(1, result.rows().size());
        assertEquals("B", result.rows().get(0).get("code"));
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
    @Transactional
    void writeIdempotencyReplaysAndRejectsConflicts() {
        Map<String, Value> params = Map.of(
                "code", string("IDEM"),
                "name", string("Idempotent"),
                "status", string("ACTIVE"),
                "note", Value.newBuilder().setNullValue(com.google.protobuf.NullValue.NULL_VALUE).build(),
                "tags", Value.newBuilder().setListValue(com.google.protobuf.ListValue.newBuilder()
                        .addValues(string("a")).addValues(string("b"))).build());
        PluginDataExecutor.Result first = executor.execute(identity(), "test.things.insert.optional",
                "idem-1", params, "idem-key-1");
        PluginDataExecutor.Result replay = executor.execute(identity(), "test.things.insert.optional",
                "idem-2", params, "idem-key-1");
        assertEquals(first.rows().get(0).get("id"), replay.rows().get(0).get("id"));
        Number count = (Number) em.createNativeQuery(
                        "SELECT count(*) FROM " + schema + ".things WHERE code = 'IDEM'")
                .getSingleResult();
        assertEquals(1, count.intValue());

        PluginDataException conflict = org.junit.jupiter.api.Assertions.assertThrows(
                PluginDataException.class, () -> executor.execute(identity(),
                        "test.things.insert.optional", "idem-3",
                        Map.of("code", string("IDEM2"), "name", string("Other"), "status", string("ACTIVE")),
                        "idem-key-1"));
        assertEquals(PluginDataException.Code.IDEMPOTENCY_CONFLICT, conflict.code());
    }

    @Test
    @Transactional
    void batchIdempotencyReplaysWithoutDoubleWrite() {
        List<PluginDataExecutor.BatchStatement> batch = List.of(
                new PluginDataExecutor.BatchStatement("test.things.insert.optional", "batch-1",
                        Map.of("code", string("B1"), "name", string("Batch one"), "status", string("ACTIVE"))),
                new PluginDataExecutor.BatchStatement("test.things.insert.optional", "batch-2",
                        Map.of("code", string("B2"), "name", string("Batch two"), "status", string("ACTIVE"))));
        List<PluginDataExecutor.Result> first = executor.executeBatch(identity(), batch, "batch-key-1");
        List<PluginDataExecutor.Result> replay = executor.executeBatch(identity(), batch, "batch-key-1");
        assertEquals(first.get(0).rows().get(0).get("id"), replay.get(0).rows().get(0).get("id"));
        Number count = (Number) em.createNativeQuery(
                        "SELECT count(*) FROM " + schema + ".things WHERE code IN ('B1','B2')")
                .getSingleResult();
        assertEquals(2, count.intValue());
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
