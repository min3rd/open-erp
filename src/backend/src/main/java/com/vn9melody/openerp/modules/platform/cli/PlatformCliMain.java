package com.vn9melody.openerp.modules.platform.cli;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.QuarkusApplication;
import io.quarkus.runtime.annotations.QuarkusMain;
import jakarta.inject.Inject;
import java.util.Arrays;

/**
 * Quarkus command-mode entry point (TASK-295). When invoked as
 * {@code admin-cli <command>} the process runs the offline CLI and exits; otherwise
 * the normal HTTP application keeps running.
 */
@QuarkusMain
public class PlatformCliMain implements QuarkusApplication {

    @Inject
    PlatformAdminCli cli;

    @Override
    public int run(String... args) {
        if (args != null && args.length > 0 && "admin-cli".equalsIgnoreCase(args[0])) {
            return cli.execute(Arrays.copyOfRange(args, 1, args.length));
        }
        Quarkus.waitForExit();
        return 0;
    }
}
