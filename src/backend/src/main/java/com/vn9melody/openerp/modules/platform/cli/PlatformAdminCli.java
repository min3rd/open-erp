package com.vn9melody.openerp.modules.platform.cli;

import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PlatformAdminService;
import com.vn9melody.openerp.modules.platform.service.PlatformAuditActions;
import com.vn9melody.openerp.modules.platform.service.PlatformBootstrapService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Offline platform admin CLI (TASK-295 / SOL-01 1.2.6). Runs inside the Quarkus
 * runtime through {@link PlatformCliMain}:
 * <pre>java -jar quarkus-run.jar admin-cli &lt;command&gt;</pre>
 * Requires {@code OPENERP_ADMIN_BOOTSTRAP_SECRET}; passwords are never accepted as
 * CLI arguments. Every action writes an audit entry with {@code actor_type = CLI}
 * and {@code ip_address = local-console}.
 */
@ApplicationScoped
public class PlatformAdminCli {

    private static final Logger LOG = Logger.getLogger(PlatformAdminCli.class);

    @Inject
    PlatformAdminService adminService;

    @Inject
    PlatformBootstrapService bootstrapService;

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Transactional
    public int execute(String[] args) {
        if (args == null || args.length == 0) {
            printUsage();
            return 1;
        }
        String command = args[0].toLowerCase();
        if (List.of("help", "-h", "--help").contains(command)) {
            printUsage();
            return 0;
        }

        String secret = System.getenv("OPENERP_ADMIN_BOOTSTRAP_SECRET");
        if (secret == null || secret.isBlank()) {
            // Test/local fallback: the secret may also be supplied through config
            // (system property). Passwords are still never accepted as CLI args.
            secret = System.getProperty("openerp.platform.bootstrap-secret");
        }
        if (!bootstrapService.verifySecret(secret)) {
            System.err.println("ERROR: OPENERP_ADMIN_BOOTSTRAP_SECRET is missing or invalid");
            return 2;
        }

        try {
            return switch (command) {
                case "bootstrap" -> bootstrap();
                case "list-admins", "list" -> listAdmins();
                case "grant-admin", "grant" -> grantAdmin(args);
                case "revoke-admin", "revoke" -> revokeAdmin(args);
                default -> {
                    System.err.println("ERROR: unknown command '" + command + "'");
                    printUsage();
                    yield 1;
                }
            };
        } catch (IllegalArgumentException e) {
            System.err.println("ERROR: " + e.getMessage());
            return 1;
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            LOG.errorf(e, "Platform CLI command '%s' failed", command);
            return 3;
        }
    }

    private int bootstrap() {
        PlatformBootstrapService.BootstrapResult result =
            bootstrapService.runBootstrap(bootstrapService.configuredEmails());
        if (!result.ran) {
            System.out.println("Bootstrap skipped: " + result.skippedReason);
            return 0;
        }
        System.out.printf("Bootstrap finished: %d user(s) created, %d upgraded, %d admin(s) granted%n",
            result.createdUsers, result.upgradedUsers, result.grantedAdmins);
        return 0;
    }

    private int listAdmins() {
        List<PlatformSuperAdmin> admins = superAdminRepository.list("order by createdAt asc");
        if (admins.isEmpty()) {
            System.out.println("No platform admins found.");
            return 0;
        }
        System.out.printf("%-38s %-32s %-18s %-10s %s%n", "ADMIN_ID", "EMAIL", "ROLE", "STATUS", "2FA_REQUIRED");
        for (PlatformSuperAdmin admin : admins) {
            User user = User.findById(admin.userId);
            System.out.printf("%-38s %-32s %-18s %-10s %s%n",
                admin.id, user != null ? user.email : admin.userId, admin.role, admin.status,
                Boolean.TRUE.equals(admin.twoFactorRequired));
        }
        return 0;
    }

    private int grantAdmin(String[] args) {
        String email = option(args, "--email");
        String role = option(args, "--role");
        String fullName = option(args, "--name");
        if (email == null || role == null) {
            System.err.println("ERROR: grant-admin requires --email and --role");
            return 1;
        }
        PlatformRequests.AdminGrant request = new PlatformRequests.AdminGrant();
        request.email = email;
        request.role = role;
        request.fullName = fullName;

        PlatformAdminService.GrantOutcome outcome = adminService.grant(request, cliActor(null));
        System.out.printf("Granted %s admin access to %s (status=%s, invitation_sent=%s)%n",
            outcome.response.role, outcome.response.email, outcome.response.status, outcome.invitationSent);
        return 0;
    }

    private int revokeAdmin(String[] args) {
        String email = option(args, "--email");
        if (email == null) {
            System.err.println("ERROR: revoke-admin requires --email");
            return 1;
        }
        User user = User.findByEmail(email);
        if (user == null) {
            System.err.println("ERROR: no user found for email " + email);
            return 1;
        }
        PlatformSuperAdmin admin = superAdminRepository.findByUserId(user.id);
        if (admin == null) {
            System.err.println("ERROR: " + email + " is not a platform admin");
            return 1;
        }
        adminService.revoke(admin.id, "Revoked via offline admin CLI", cliActor(admin.userId));
        System.out.printf("Revoked platform admin %s (%s)%n", email, admin.id);
        return 0;
    }

    private PlatformActor cliActor(UUID excludeUserId) {
        // The audit trail requires a concrete user id; prefer an active admin other
        // than the target, then any active admin, then the target user (bootstrap).
        UUID actorUserId = superAdminRepository.listActive().stream()
            .map(admin -> admin.userId)
            .filter(id -> !id.equals(excludeUserId))
            .findFirst()
            .orElse(null);
        if (actorUserId == null) {
            actorUserId = superAdminRepository.listActive().stream()
                .map(admin -> admin.userId)
                .findFirst()
                .orElse(excludeUserId);
        }
        if (actorUserId == null) {
            throw new IllegalArgumentException("No user available to attribute the CLI audit entry");
        }
        String actorEmail = "cli@openerp.local";
        User actor = User.findById(actorUserId);
        if (actor != null) {
            actorEmail = actor.email;
        }
        PlatformActor platformActor = PlatformActor.of(actorUserId, actorEmail, PlatformAdminRole.SUPER_ADMIN,
            "local-console", "platform-admin-cli");
        platformActor.explicitActorType = ActorType.CLI;
        return platformActor;
    }

    private String option(String[] args, String name) {
        for (int i = 1; i < args.length - 1; i++) {
            if (name.equalsIgnoreCase(args[i])) {
                return args[i + 1];
            }
        }
        return null;
    }

    private void printUsage() {
        System.out.println("Open-ERP Platform Admin CLI");
        System.out.println("Usage: admin-cli <command> [options]");
        System.out.println("Commands:");
        System.out.println("  bootstrap                          Seed/bootstrap admins from openerp.platform.bootstrap-emails");
        System.out.println("  list-admins                        List platform admin accounts");
        System.out.println("  grant-admin --email X --role R     Grant SUPER_ADMIN|SUPPORT_ENGINEER to X");
        System.out.println("  revoke-admin --email X             Revoke platform admin access from X");
        System.out.println("Required env: OPENERP_ADMIN_BOOTSTRAP_SECRET");
    }
}
