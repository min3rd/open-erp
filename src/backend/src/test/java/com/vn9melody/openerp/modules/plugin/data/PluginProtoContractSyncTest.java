package com.vn9melody.openerp.modules.plugin.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/**
 * TASK-402: the SDK ships its own copy of the gRPC contract so plugin builds do
 * not depend on the core source tree. This guard fails when the two drift.
 */
public class PluginProtoContractSyncTest {

    @Test
    void sdkProtoMatchesCoreContract() throws Exception {
        Path core = Path.of("src", "main", "proto", "plugin_data.proto");
        Path sdk = Path.of("..", "..", "plugins", "sdk", "src", "main", "proto", "plugin_data.proto");
        assumeTrue(Files.exists(core), "core proto not found from test working directory");
        assumeTrue(Files.exists(sdk), "SDK proto not present in this build context");
        assertEquals(normalize(Files.readString(core)), normalize(Files.readString(sdk)));
    }

    private static String normalize(String value) {
        return value.replace("\r\n", "\n").strip();
    }
}
