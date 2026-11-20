package com.vn9melody.openerp.plugins.office.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugins.office.api.OfficeErrorCode;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OfficeDocumentValidationTest {

    @Test
    void acceptsAllSupportedWordExtensionsAndMapsMetadata() {
        for (String ext : new String[] { "docx", "doc", "dotx", "rtf", "odt", "xml" }) {
            assertEquals(ext, OfficeDocumentService.validateExtension(null, "sample." + ext));
            assertEquals("WORD", OfficeDocumentService.docTypeOf(ext));
        }
        assertEquals("application/msword", OfficeDocumentService.defaultMime(null, "doc"));
        assertEquals("application/vnd.openxmlformats-officedocument.wordprocessingml.template",
                OfficeDocumentService.defaultMime(null, "dotx"));
        assertEquals("application/rtf", OfficeDocumentService.defaultMime(null, "rtf"));
        assertEquals("application/vnd.oasis.opendocument.text",
                OfficeDocumentService.defaultMime(null, "odt"));
        assertEquals("application/xml", OfficeDocumentService.defaultMime(null, "xml"));
    }

    @Test
    void rejectsMacroEnabledAndUnknownExtensions() {
        for (String macro : new String[] { "docm", "dotm" }) {
            ApiException ex = assertThrows(ApiException.class,
                    () -> OfficeDocumentService.validateExtension(null, "bad." + macro));
            assertEquals(400, ex.getStatusCode());
            assertEquals(OfficeErrorCode.OFFICE_MACRO_FILE_UNSUPPORTED, ex.getCode());
        }
        ApiException unknown = assertThrows(ApiException.class,
                () -> OfficeDocumentService.validateExtension(null, "legacy.docy"));
        assertEquals(400, unknown.getStatusCode());
        assertEquals(OfficeErrorCode.OFFICE_UNSUPPORTED_EXTENSION, unknown.getCode());
    }

    @Test
    void validatesWordMagicSignaturesAndRejectsMismatch() {
        byte[] zip = new byte[] { 0x50, 0x4b, 0x03, 0x04, 0, 0 };
        byte[] ole2 = new byte[] {
                (byte) 0xd0, (byte) 0xcf, 0x11, (byte) 0xe0, (byte) 0xa1, (byte) 0xb1, 0x1a, (byte) 0xe1
        };
        byte[] rtf = "{\\rtf1\\ansi Xin chao}".getBytes(StandardCharsets.UTF_8);
        byte[] xml = "\uFEFF<?xml version=\"1.0\"?><pkg:package/>".getBytes(StandardCharsets.UTF_8);
        byte[] html = "<!DOCTYPE html><html><body>Hi</body></html>".getBytes(StandardCharsets.UTF_8);
        byte[] mht = "MIME-Version: 1.0\r\nContent-Type: multipart/related".getBytes(StandardCharsets.UTF_8);

        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("docx", zip));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("dotx", zip));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("odt", zip));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("rtf", rtf));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("xml", xml));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("doc", ole2));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("doc", rtf));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("doc", zip));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("doc", xml));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("doc", html));
        assertDoesNotThrow(() -> OfficeDocumentService.validateMagic("doc", mht));

        for (String[] pair : new String[][] {
                { "dotx", "not-zip" },
                { "odt", "not-zip" },
                { "rtf", "<html><body>not rtf</body></html>" },
                { "xml", "{\\rtf1 not xml}" },
                { "doc", "random plain text" }
        }) {
            byte[] bad = pair[1].getBytes(StandardCharsets.UTF_8);
            ApiException mismatch = assertThrows(ApiException.class,
                    () -> OfficeDocumentService.validateMagic(pair[0], bad));
            assertEquals(400, mismatch.getStatusCode());
            assertEquals(OfficeErrorCode.OFFICE_INVALID_MAGIC_BYTES, mismatch.getCode());
        }
    }
}
