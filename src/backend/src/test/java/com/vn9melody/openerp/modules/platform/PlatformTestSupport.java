package com.vn9melody.openerp.modules.platform;

import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantPlanTier;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.TenantType;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.iam.model.UserTenantId;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.model.PlatformImpersonationLog;
import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.UUID;

/**
 * Shared fixtures/cleanup for the Wave 2B platform test suites. All rows use the
 * {@code s2plat-} prefix to stay isolated from the other parallel agents.
 */
public final class PlatformTestSupport {

    public static final String PREFIX = "s2plat-";
    public static final String PASSWORD = "S2PlatP@ssw0rd123";

    private PlatformTestSupport() {}

    @Transactional
    public static User createUser(String email, AccountStatus status, PasswordHashService passwordHashService) {
        User user = new User();
        user.email = email;
        user.status = status;
        user.emailVerifiedAt = Instant.now();
        user.persist();

        UserCredential credential = new UserCredential();
        credential.user = user;
        credential.userId = user.id;
        credential.passwordHash = passwordHashService.hashPassword(PASSWORD);
        credential.persist();

        UserProfile profile = new UserProfile();
        profile.user = user;
        profile.userId = user.id;
        profile.fullName = "S2 Platform " + email;
        profile.persist();
        return user;
    }

    @Transactional
    public static PlatformSuperAdmin createPlatformAdmin(String email, PlatformAdminRole role,
                                                         PlatformAdminStatus status,
                                                         PasswordHashService passwordHashService) {
        User user = createUser(email, AccountStatus.ACTIVE, passwordHashService);
        PlatformSuperAdmin admin = new PlatformSuperAdmin();
        admin.userId = user.id;
        admin.role = role;
        admin.status = status;
        admin.isActive = status == PlatformAdminStatus.ACTIVE;
        admin.mustChangePassword = false;
        admin.twoFactorRequired = true;
        admin.persist();
        return admin;
    }

    @Transactional
    public static Tenant createTenant(String slug, TenantStatus status) {
        Tenant tenant = new Tenant();
        tenant.slug = slug;
        tenant.name = "S2 Platform " + slug;
        tenant.type = TenantType.BUSINESS;
        tenant.status = status;
        tenant.planTier = TenantPlanTier.STANDARD;
        tenant.maxUsers = 10;
        tenant.maxStorageMb = 5120;
        tenant.isLocked = status == TenantStatus.SUSPENDED;
        tenant.persist();
        return tenant;
    }

    @Transactional
    public static UserTenant addMembership(User user, Tenant tenant, UserRole role) {
        User managedUser = User.findById(user.id);
        Tenant managedTenant = Tenant.findById(tenant.id);
        UserTenant membership = new UserTenant();
        membership.id = new UserTenantId(managedUser.id, managedTenant.id);
        membership.user = managedUser;
        membership.tenant = managedTenant;
        membership.role = role;
        membership.isDefault = true;
        membership.persist();
        return membership;
    }

    @Transactional
    public static void cleanup(EntityManager entityManager) {
        com.vn9melody.openerp.support.TestDbCleanup.cleanup(entityManager);
    }

    public static void clearRedis(RedisDataSource redis) {
        com.vn9melody.openerp.support.TestDbCleanup.clearRedis(redis);
    }

    public static long countAudit(EntityManager entityManager, String action) {
        Object count = entityManager.createNativeQuery(
                "SELECT count(*) FROM platform_audit_logs WHERE action = :action")
            .setParameter("action", action)
            .getSingleResult();
        return count != null ? ((Number) count).longValue() : 0L;
    }
}
