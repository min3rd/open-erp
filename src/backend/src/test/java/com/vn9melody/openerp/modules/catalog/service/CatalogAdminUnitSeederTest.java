package com.vn9melody.openerp.modules.catalog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-393 / AC-21: the admin-unit seeder materialises the CSV as system
 * PROVINCE/COMMUNE rows plus direct province -> commune HIERARCHY edges on real
 * PostgreSQL, and re-running it changes nothing.
 *
 * <p>When {@code db/seed/provinces-communes.csv} is absent the test is skipped
 * with an explicit assumption failure (never a false green).</p>
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogAdminUnitSeederTest {

    private static final String CSV_RESOURCE = "db/seed/provinces-communes.csv";

    @Inject
    CatalogAdminUnitSeeder seeder;

    @Inject
    EntityManager entityManager;

    @Test
    @DisplayName("TASK-393: CSV seeds provinces, communes and exactly one direct parent per commune")
    void seedsAdminUnitsFromCsv() {
        CsvCounts csv = readCsvCounts();
        Assumptions.assumeTrue(csv != null,
            CSV_RESOURCE + " is not on the test classpath — admin-unit seeder test skipped");

        DbCounts counts = QuarkusTransaction.requiringNew().call(this::loadCounts);
        assertTrue(counts.provinces() >= 1, "at least one province must be seeded");
        assertEquals(csv.provinces(), counts.provinces(), "province count must match the CSV");
        assertEquals(csv.communes(), counts.communes(), "commune count must match the CSV");
        assertEquals(counts.communes(), counts.communeParents(),
            "every commune must have exactly one province parent");
        assertEquals(0L, counts.communesWithMultipleParents(), "no commune may have several parents");
        assertEquals(0L, counts.districts(), "districts are not seeded (N6: direct province -> commune)");
    }

    @Test
    @DisplayName("TASK-393: re-running the seeder is idempotent")
    void seedingIsIdempotent() {
        Assumptions.assumeTrue(readCsvCounts() != null, CSV_RESOURCE + " is not on the test classpath");

        DbCounts before = QuarkusTransaction.requiringNew().call(this::loadCounts);
        QuarkusTransaction.requiringNew().run(seeder::seed);
        DbCounts after = QuarkusTransaction.requiringNew().call(this::loadCounts);
        assertEquals(before, after, "a second seed run must not duplicate items or edges");
    }

    private DbCounts loadCounts() {
        return new DbCounts(
            count("""
                SELECT count(*) FROM catalog_items i
                JOIN catalog_types t ON t.id = i.type_id
                WHERE i.tenant_id IS NULL AND t.code = 'PROVINCE' AND i.valid_to IS NULL
                """),
            count("""
                SELECT count(*) FROM catalog_items i
                JOIN catalog_types t ON t.id = i.type_id
                WHERE i.tenant_id IS NULL AND t.code = 'COMMUNE' AND i.valid_to IS NULL
                """),
            count("""
                SELECT count(DISTINCT e.child_item_id) FROM catalog_item_edges e
                JOIN catalog_items i ON i.id = e.child_item_id
                JOIN catalog_types t ON t.id = i.type_id
                WHERE i.tenant_id IS NULL AND t.code = 'COMMUNE' AND e.valid_to IS NULL
                """),
            count("""
                SELECT count(*) FROM (
                    SELECT e.child_item_id FROM catalog_item_edges e
                    JOIN catalog_items i ON i.id = e.child_item_id
                    JOIN catalog_types t ON t.id = i.type_id
                    WHERE i.tenant_id IS NULL AND t.code = 'COMMUNE' AND e.valid_to IS NULL
                    GROUP BY e.child_item_id HAVING count(*) > 1
                ) multi_parent
                """),
            count("""
                SELECT count(*) FROM catalog_items i
                JOIN catalog_types t ON t.id = i.type_id
                WHERE i.tenant_id IS NULL AND t.code = 'DISTRICT' AND i.valid_to IS NULL
                """));
    }

    private long count(String sql) {
        Number result = (Number) entityManager.createNativeQuery(sql).getSingleResult();
        return result == null ? 0L : result.longValue();
    }

    private CsvCounts readCsvCounts() {
        InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(CSV_RESOURCE);
        if (stream == null) {
            return null;
        }
        Set<String> provinces = new HashSet<>();
        long communes = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("\uFEFF")) {
                    line = line.substring(1);
                }
                line = line.strip();
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("province_code,")) {
                    continue;
                }
                String[] parts = line.split(",", 4);
                if (parts.length < 4) {
                    continue;
                }
                provinces.add(parts[0].strip());
                communes++;
            }
        } catch (IOException e) {
            return null;
        }
        return communes == 0 ? null : new CsvCounts(provinces.size(), communes);
    }

    record CsvCounts(int provinces, long communes) {
    }

    record DbCounts(long provinces, long communes, long communeParents,
                    long communesWithMultipleParents, long districts) {
    }
}
