package com.vn9melody.openerp.modules.catalog.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.core.enums.CatalogRelationType;
import com.vn9melody.openerp.modules.catalog.CatalogTestFixtures;
import com.vn9melody.openerp.modules.catalog.model.CatalogItem;
import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-375/TASK-377: catalog schema constraints and recursive queries on real
 * PostgreSQL (no H2). Covers the EXCLUDE validity windows, the cycle guard,
 * the merged system+tenant options query and as-of version lookup.
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogRepositoryPostgresTest {

    @Inject
    EntityManager entityManager;

    @Inject
    CatalogItemRepository itemRepository;

    @Inject
    CatalogItemEdgeRepository edgeRepository;

    private Tenant tenant;

    @BeforeEach
    @Transactional
    void setUp() {
        CatalogTestFixtures.cleanup(entityManager);
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("catalog-repo");
    }

    @AfterEach
    @Transactional
    void tearDown() {
        CatalogTestFixtures.cleanup(entityManager);
        S2IamFixtures.cleanup();
    }

    @Test
    @DisplayName("AC-07: EXCLUDE rejects an overlapping validity window for the same (tenant, type, code)")
    void excludeConstraintRejectsOverlappingVersionWindows() {
        String code = CatalogTestFixtures.PREFIX + "_EXCL_1";
        UUID groupId = UUID.randomUUID();
        UUID typeId = QuarkusTransaction.requiringNew().call(() -> {
            CatalogType type = CatalogTestFixtures.createType(tenant.id, CatalogTestFixtures.PREFIX + "_EXCL",
                CatalogHierarchyMode.TREE);
            CatalogItem first = CatalogTestFixtures.createItemVersion(tenant.id, type.id, groupId, 1, code,
                "Version 1", Instant.now().minus(2, ChronoUnit.HOURS), null);
            assertNotNull(first.id);
            return type.id;
        });

        RuntimeException failure = assertThrows(RuntimeException.class,
            () -> QuarkusTransaction.requiringNew().run(() -> {
                // Same (tenant, type, code), next version, overlapping validity window.
                CatalogTestFixtures.createItemVersion(tenant.id, typeId, groupId, 2, code,
                    "Version 2", Instant.now().minus(1, ChronoUnit.HOURS), null);
                entityManager.flush();
            }));

        assertTrue(causeChain(failure).contains("ex_catalog_item_window"),
            "the exclusion constraint must be the failure cause: " + causeChain(failure));

        long rows = QuarkusTransaction.requiringNew().call(() -> ((Number) entityManager.createNativeQuery(
                "SELECT count(*) FROM catalog_items WHERE tenant_id = ?1 AND type_id = ?2 AND code = ?3")
            .setParameter(1, tenant.id)
            .setParameter(2, typeId)
            .setParameter(3, code)
            .getSingleResult()).longValue());
        assertEquals(1L, rows, "the overlapping version must not be persisted");
    }

    @Test
    @Transactional
    @DisplayName("AC-05/AC-01/AC-02: wouldCreateCycle blocks cycles and CTE walks descendants/ancestors")
    void cycleGuardAndRecursiveQueries() {
        CatalogType type = CatalogTestFixtures.createType(tenant.id, CatalogTestFixtures.PREFIX + "_DAG",
            CatalogHierarchyMode.DAG);
        Instant now = Instant.now().minus(1, ChronoUnit.MINUTES);
        CatalogItem root = CatalogTestFixtures.createItem(tenant.id, type.id, CatalogTestFixtures.PREFIX + "_DAG_A",
            "A", now, null);
        CatalogItem mid = CatalogTestFixtures.createItem(tenant.id, type.id, CatalogTestFixtures.PREFIX + "_DAG_B",
            "B", now, null);
        CatalogItem leaf = CatalogTestFixtures.createItem(tenant.id, type.id, CatalogTestFixtures.PREFIX + "_DAG_C",
            "C", now, null);
        CatalogTestFixtures.createEdge(tenant.id, root.id, mid.id, CatalogRelationType.HIERARCHY);
        CatalogTestFixtures.createEdge(tenant.id, mid.id, leaf.id, CatalogRelationType.HIERARCHY);
        entityManager.flush();

        assertFalse(edgeRepository.wouldCreateCycle(root.id, mid.id), "an existing edge is not a cycle");
        assertTrue(edgeRepository.wouldCreateCycle(leaf.id, root.id), "leaf -> root would close a cycle");
        assertTrue(edgeRepository.wouldCreateCycle(root.id, root.id), "self reference would close a cycle");

        List<CatalogItem> descendants = edgeRepository.findDescendants(root.id, tenant.id, Instant.now(), 20);
        assertEquals(Set.of(mid.id, leaf.id), ids(descendants), "all transitive children are returned");

        List<CatalogItem> depthOne = edgeRepository.findDescendants(root.id, tenant.id, Instant.now(), 1);
        assertEquals(Set.of(mid.id), ids(depthOne), "maxDepth limits the recursion");
    }

    @Test
    @Transactional
    @DisplayName("AC-10: merged options prefer the tenant row over the system row with the same code")
    void mergedOptionsPreferTenantRow() {
        String typeCode = CatalogTestFixtures.PREFIX + "_OPTIONS";
        CatalogType systemType = CatalogTestFixtures.createSystemType(typeCode, CatalogHierarchyMode.FLAT);
        CatalogItem systemItem = CatalogTestFixtures.createItem(null, systemType.id,
            CatalogTestFixtures.PREFIX + "_OPT_A", "System A", Instant.now().minus(1, ChronoUnit.HOURS), null);
        CatalogItem tenantOverride = CatalogTestFixtures.createItem(tenant.id, systemType.id,
            CatalogTestFixtures.PREFIX + "_OPT_A", "Tenant A", Instant.now().minus(1, ChronoUnit.HOURS), null);
        CatalogTestFixtures.createItem(tenant.id, systemType.id, CatalogTestFixtures.PREFIX + "_OPT_B",
            "Tenant B", Instant.now().minus(1, ChronoUnit.HOURS), null);
        entityManager.flush();

        List<CatalogItem> merged = itemRepository.findMergedOptions(typeCode, tenant.id, Instant.now(), "", 0, 20);
        assertEquals(2, merged.size(), "one row per code (tenant wins), system-only rows included");
        CatalogItem optionA = merged.stream()
            .filter(item -> (CatalogTestFixtures.PREFIX + "_OPT_A").equals(item.code))
            .findFirst().orElseThrow();
        assertEquals("Tenant A", optionA.name);
        assertEquals(tenant.id, optionA.tenantId);
        assertEquals(tenantOverride.id, optionA.id);

        assertEquals(2L, itemRepository.countMergedOptions(typeCode, tenant.id, Instant.now(), ""));
        List<CatalogItem> searched = itemRepository.findMergedOptions(typeCode, tenant.id, Instant.now(),
            "Tenant A", 0, 20);
        assertEquals(1, searched.size(), "q filters on code/name");
        assertEquals(tenantOverride.id, searched.get(0).id);

        List<CatalogItem> firstPage = itemRepository.findMergedOptions(typeCode, tenant.id, Instant.now(), "", 0, 1);
        List<CatalogItem> secondPage = itemRepository.findMergedOptions(typeCode, tenant.id, Instant.now(), "", 1, 1);
        assertEquals(1, firstPage.size());
        assertEquals(1, secondPage.size());
        assertEquals(CatalogTestFixtures.PREFIX + "_OPT_A", firstPage.get(0).code, "ordered by code");
        assertEquals(CatalogTestFixtures.PREFIX + "_OPT_B", secondPage.get(0).code);

        // AC-15: another tenant only sees the system row.
        Tenant other = S2IamFixtures.createTenant("catalog-repo-other");
        entityManager.flush();
        List<CatalogItem> otherView = itemRepository.findMergedOptions(typeCode, other.id, Instant.now(), "", 0, 20);
        assertEquals(1, otherView.size(), "tenant rows never leak across tenants");
        assertEquals(systemItem.id, otherView.get(0).id);
    }

    @Test
    @Transactional
    @DisplayName("AC-06/AC-08: as_of returns the version valid at that instant")
    void asOfReturnsTheVersionValidAtInstant() {
        String typeCode = CatalogTestFixtures.PREFIX + "_ASOF";
        CatalogType type = CatalogTestFixtures.createType(tenant.id, typeCode, CatalogHierarchyMode.TREE);
        String code = CatalogTestFixtures.PREFIX + "_ASOF_1";
        UUID groupId = UUID.randomUUID();
        Instant base = Instant.now().minus(4, ChronoUnit.HOURS);
        CatalogItem v1 = CatalogTestFixtures.createItemVersion(tenant.id, type.id, groupId, 1, code, "V1",
            base, base.plus(2, ChronoUnit.HOURS));
        CatalogItem v2 = CatalogTestFixtures.createItemVersion(tenant.id, type.id, groupId, 2, code, "V2",
            base.plus(2, ChronoUnit.HOURS), null);
        entityManager.flush();

        List<CatalogItem> beforeCut = itemRepository.findMergedOptions(typeCode, tenant.id,
            base.plus(1, ChronoUnit.HOURS), "", 0, 10);
        assertEquals(1, beforeCut.size());
        assertEquals(v1.id, beforeCut.get(0).id);
        assertEquals(1, beforeCut.get(0).version);

        List<CatalogItem> afterCut = itemRepository.findMergedOptions(typeCode, tenant.id,
            base.plus(3, ChronoUnit.HOURS), "", 0, 10);
        assertEquals(1, afterCut.size());
        assertEquals(v2.id, afterCut.get(0).id);
        assertEquals(2, afterCut.get(0).version);
    }

    private static Set<UUID> ids(List<CatalogItem> items) {
        return items.stream().map(item -> item.id).collect(Collectors.toSet());
    }

    private static String causeChain(Throwable failure) {
        StringBuilder messages = new StringBuilder();
        for (Throwable current = failure; current != null; current = current.getCause()) {
            messages.append(current.getClass().getSimpleName()).append(": ")
                .append(current.getMessage()).append('\n');
            if (current.getCause() == current) {
                break;
            }
        }
        return messages.toString();
    }
}
