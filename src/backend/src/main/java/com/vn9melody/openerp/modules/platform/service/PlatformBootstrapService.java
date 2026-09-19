package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;
import org.jboss.logging.Logger;

/**
 * First-run Super Admin provisioning from configuration (TASK-274 / SOL-01 1.2.3).
 * Idempotent and secret-gated; only runs when no ACTIVE SUPER_ADMIN exists.
 */
@ApplicationScoped
public class PlatformBootstrapService {

    private static final Logger LOG = Logger.getLogger(PlatformBootstrapService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public static class BootstrapResult {
        public boolean ran;
        public String skippedReason;
        public int createdUsers;
        public int upgradedUsers;
        public int grantedAdmins;
        public List<String> emails = new ArrayList<>();
    }

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    AuditLogService auditLogService;

    @Inject
    ObjectMapper objectMapper;

    private final SecureRandom secureRandom = new SecureRandom();

    void onStart(@Observes StartupEvent event) {
        try {
            io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().run(this::runBootstrapFromConfig);
        } catch (Exception e) {
            LOG.warnf("Platform bootstrap skipped due to error: %s", e.getMessage());
        }
    }

    @Transactional
    public BootstrapResult runBootstrapFromConfig() {
        List<String> emails = parseEmails(configuredEmailsCsv());
        if (emails.isEmpty()) {
            LOG.info("Platform bootstrap: no emails configured, skipping");
            return skipped("NO_CONFIGURED_EMAILS");
        }
        if (configuredSecret() == null || configuredSecret().isBlank()) {
            LOG.warn("Platform bootstrap: OPENERP_ADMIN_BOOTSTRAP_SECRET is not set, skipping safely");
            return skipped("BOOTSTRAP_SECRET_MISSING");
        }
        return runBootstrap(emails);
    }

    /**
     * Seeds/bootstrap for the given emails. Used by StartupEvent, the admin CLI and tests.
     * The secret gate is validated by {@link #runBootstrapFromConfig()} and the CLI.
     */
    @Transactional
    public BootstrapResult runBootstrap(List<String> rawEmails) {
        if (superAdminRepository.count("role = ?1 and status = ?2",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE) > 0) {
            LOG.info("Platform bootstrap: an ACTIVE SUPER_ADMIN already exists, skipping");
            return skipped("ACTIVE_SUPER_ADMIN_EXISTS");
        }

        BootstrapResult result = new BootstrapResult();
        result.ran = true;

        for (String rawEmail : rawEmails) {
            if (rawEmail == null) {
                continue;
            }
            String email = rawEmail.trim().toLowerCase();
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                LOG.warnf("Platform bootstrap: invalid email format '%s', skipping", email);
                continue;
            }
            result.emails.add(email);

            User user = User.findByEmail(email);
            boolean createdUser = false;
            if (user == null) {
                user = new User();
                user.email = email;
                user.status = AccountStatus.ACTIVE;
                user.emailVerifiedAt = Instant.now();
                user.persist();

                UserCredential credential = new UserCredential();
                credential.user = user;
                credential.userId = user.id;
                credential.passwordHash = passwordHashService.hashPassword(generateTemporaryPassword());
                credential.persist();

                UserProfile profile = new UserProfile();
                profile.user = user;
                profile.userId = user.id;
                profile.fullName = deriveFullName(email);
                profile.persist();
                createdUser = true;
                result.createdUsers++;
            } else {
                result.upgradedUsers++;
            }

            PlatformSuperAdmin admin = superAdminRepository.findByUserId(user.id);
            boolean newAdmin = false;
            if (admin == null) {
                admin = new PlatformSuperAdmin();
                admin.userId = user.id;
                newAdmin = true;
            }
            admin.role = PlatformAdminRole.SUPER_ADMIN;
            admin.status = PlatformAdminStatus.ACTIVE;
            admin.isActive = true;
            admin.mustChangePassword = true;
            admin.twoFactorRequired = true;
            admin.persist();
            if (newAdmin) {
                result.grantedAdmins++;
            }

            ObjectNode details = objectMapper.createObjectNode();
            details.put("bootstrap_email", email);
            details.put("user_created", createdUser);
            auditLogService.record(AuditLogEntry
                .of(AuditScope.PLATFORM, null, ActorType.SYSTEM, user.id,
                    PlatformAction.PLATFORM_ADMIN_BOOTSTRAPPED.name(), AuditResult.SUCCESS)
                .targetUser(user.id)
                .resource("PLATFORM_ADMIN", admin.id)
                .details(details)
                .reason("First-run bootstrap from configuration")
                .client("local-console", "bootstrap"));

            LOG.infof("Platform bootstrap: granted SUPER_ADMIN to %s", email);
        }
        return result;
    }

    public boolean verifySecret(String candidate) {
        String expected = configuredSecret();
        if (expected == null || expected.isBlank()) {
            return false;
        }
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = (candidate == null ? "" : candidate).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expectedBytes, providedBytes);
    }

    private String configuredSecret() {
        String fromEnv = System.getenv("OPENERP_ADMIN_BOOTSTRAP_SECRET");
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        String fromProperty = System.getProperty("openerp.platform.bootstrap-secret");
        if (fromProperty != null && !fromProperty.isBlank()) {
            return fromProperty;
        }
        return org.eclipse.microprofile.config.ConfigProvider.getConfig()
            .getOptionalValue("openerp.platform.bootstrap-secret", String.class)
            .orElse(null);
    }

    public List<String> configuredEmails() {
        return parseEmails(configuredEmailsCsv());
    }

    private String configuredEmailsCsv() {
        String fromEnv = System.getenv("OPENERP_PLATFORM_BOOTSTRAP_EMAILS");
        if (fromEnv != null) {
            return fromEnv;
        }
        return org.eclipse.microprofile.config.ConfigProvider.getConfig()
            .getOptionalValue("openerp.platform.bootstrap-emails", String.class)
            .orElse("");
    }

    private BootstrapResult skipped(String reason) {
        BootstrapResult result = new BootstrapResult();
        result.ran = false;
        result.skippedReason = reason;
        return result;
    }

    private List<String> parseEmails(String csv) {
        List<String> emails = new ArrayList<>();
        if (csv == null || csv.isBlank()) {
            return emails;
        }
        for (String part : csv.split(",")) {
            String email = part.trim();
            if (!email.isEmpty()) {
                emails.add(email);
            }
        }
        return emails;
    }

    private String deriveFullName(String email) {
        String local = email.substring(0, email.indexOf('@'));
        String[] tokens = local.split("[._-]+");
        StringBuilder name = new StringBuilder();
        for (String token : tokens) {
            if (token.isEmpty()) {
                continue;
            }
            if (name.length() > 0) {
                name.append(' ');
            }
            name.append(Character.toUpperCase(token.charAt(0))).append(token.substring(1));
        }
        return name.length() > 0 ? name.toString() : email;
    }

    private String generateTemporaryPassword() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes) + "aA1!";
    }
}
