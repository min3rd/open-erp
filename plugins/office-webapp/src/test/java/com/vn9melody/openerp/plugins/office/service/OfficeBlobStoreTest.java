package com.vn9melody.openerp.plugins.office.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OfficeBlobStoreTest {

    @TempDir
    Path tempDir;

    @Test
    void storesAndReadsBinaryUnderTenantPrefix() {
        OfficeBlobStore store = new OfficeBlobStore();
        store.storageDir = tempDir.toString();
        UUID tenantId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        byte[] content = "PK\u0003\u0004office-binary".getBytes();

        OfficeBlobStore.StoredBinary stored = store.put(tenantId, documentId, 2, "Báo cáo Q4.docx", content);

        assertTrue(stored.storageKey().startsWith(tenantId + "/office/" + documentId + "/v2_"));
        assertTrue(stored.storageKey().endsWith(".docx"));
        assertEquals(content.length, stored.sizeBytes());
        assertEquals(64, stored.checksumSha256().length());
        assertArrayEquals(content, store.get(stored.storageKey()));
    }

    @Test
    void rejectsUnsafeStorageKey() {
        OfficeBlobStore store = new OfficeBlobStore();
        store.storageDir = tempDir.toString();
        assertThrows(ApiException.class, () -> store.get("../../secret.txt"));
    }

    @Test
    void tenantPrefixSeparatesBlobs() {
        OfficeBlobStore store = new OfficeBlobStore();
        UUID documentId = UUID.randomUUID();
        UUID tenantA = UUID.randomUUID();
        UUID tenantB = UUID.randomUUID();
        String keyA = store.keyFor(tenantA, documentId, 1, "a.docx");
        String keyB = store.keyFor(tenantB, documentId, 1, "a.docx");
        assertTrue(keyA.startsWith(tenantA + "/office/"));
        assertTrue(keyB.startsWith(tenantB + "/office/"));
        assertTrue(!keyA.equals(keyB));
    }

    @Test
    void sanitizesUnicodeFileName() {
        OfficeBlobStore store = new OfficeBlobStore();
        String key = store.keyFor(UUID.randomUUID(), UUID.randomUUID(), 1, "Báo cáo Q4.docx");
        assertTrue(key.endsWith("_B_o_c_o_Q4.docx"));
    }
}
