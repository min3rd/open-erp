package com.vn9melody.openerp.support;

import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.TenantType;
import io.quarkus.narayana.jta.QuarkusTransaction;
import com.vn9melody.openerp.modules.iam.model.Role;
import com.vn9melody.openerp.modules.iam.model.RolePermission;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserRole;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.iam.model.UserTenantId;
import com.vn9melody.openerp.modules.iam.model.RoleDataPolicy;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.Department;
import com.vn9melody.openerp.modules.organization.model.UserBranchAssignment;
import com.vn9melody.openerp.modules.organization.model.UserDepartmentMembership;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Wave 2C fixtures. Every row created here is tagged with the {@code s2iam-} prefix so the
 * suite can clean up exactly its own data and never touches other test classes' fixtures.
 */
public final class S2IamFixtures {

    public static final String SLUG_PREFIX = "s2iam-";
    public static final String CODE_PREFIX = "S2IAM-";

    private S2IamFixtures() {
    }

    public record Person(UUID userId, UUID tenantId, String email, String fullName) {
    }

    public static Tenant createTenant(String suffix) {
        Tenant tenant = new Tenant();
        tenant.slug = SLUG_PREFIX + suffix;
        tenant.name = "S2IAM " + suffix;
        tenant.type = TenantType.BUSINESS;
        tenant.status = TenantStatus.ACTIVE;
        tenant.persist();
        return tenant;
    }

    public static Person createUser(UUID tenantId, String email, String fullName) {
        User user = new User();
        user.email = email;
        user.status = AccountStatus.ACTIVE;
        user.emailVerifiedAt = Instant.now();
        user.persist();

        UserCredential credential = new UserCredential();
        credential.user = user;
        credential.userId = user.id;
        credential.passwordHash = "s2iam-test-hash";
        credential.persist();

        UserProfile profile = new UserProfile();
        profile.user = user;
        profile.userId = user.id;
        profile.fullName = fullName;
        profile.persist();

        Tenant tenant = Tenant.findById(tenantId);
        UserTenant link = new UserTenant();
        link.id = new UserTenantId(user.id, tenantId);
        link.user = user;
        link.tenant = tenant;
        link.role = com.vn9melody.openerp.core.enums.UserRole.MEMBER;
        link.isDefault = true;
        link.persist();

        return new Person(user.id, tenantId, email, fullName);
    }

    public static Branch createBranch(UUID tenantId, String codeSuffix, String name) {
        Branch branch = new Branch();
        branch.tenantId = tenantId;
        branch.code = (CODE_PREFIX + codeSuffix).toUpperCase();
        branch.name = name;
        branch.isDefault = false;
        branch.status = "ACTIVE";
        branch.persist();
        return branch;
    }

    public static Department createDepartment(UUID tenantId, UUID branchId, UUID parentId, String codeSuffix) {
        Department department = new Department();
        department.tenantId = tenantId;
        department.branchId = branchId;
        department.parentId = parentId;
        department.code = (CODE_PREFIX + codeSuffix).toUpperCase();
        department.name = "Phòng " + codeSuffix;
        department.status = "ACTIVE";
        department.persist();
        return department;
    }

    public static UserDepartmentMembership createMembership(UUID tenantId, Person person, Branch branch,
                                                            Department department, UUID managerUserId,
                                                            boolean primary) {
        UserDepartmentMembership membership = new UserDepartmentMembership();
        membership.userId = person.userId();
        membership.tenantId = tenantId;
        membership.branchId = branch.id;
        membership.departmentId = department.id;
        membership.directManagerUserId = managerUserId;
        membership.isPrimary = primary;
        membership.joinedAt = Instant.now();
        membership.persist();
        return membership;
    }

    public static UserBranchAssignment createBranchAssignment(UUID tenantId, Person person, Branch branch,
                                                              boolean primary, boolean canManage) {
        UserBranchAssignment assignment = new UserBranchAssignment();
        assignment.userId = person.userId();
        assignment.tenantId = tenantId;
        assignment.branchId = branch.id;
        assignment.isPrimary = primary;
        assignment.canManage = canManage;
        assignment.assignedAt = Instant.now();
        assignment.persist();
        return assignment;
    }

    public static Role createCustomRole(UUID tenantId, String codeSuffix, String name) {
        Role role = new Role();
        role.tenantId = tenantId;
        role.code = (CODE_PREFIX + codeSuffix).toUpperCase();
        role.name = name;
        role.description = "S2IAM fixture role";
        role.isSystem = false;
        role.createdAt = Instant.now();
        role.updatedAt = role.createdAt;
        role.persist();
        return role;
    }

    public static Role systemRole(String code) {
        return Role.find("tenantId is null and code = ?1", code).firstResult();
    }

    public static UserRole assignRole(UUID tenantId, Person person, Role role) {
        UserRole userRole = new UserRole();
        userRole.userId = person.userId();
        userRole.tenantId = tenantId;
        userRole.roleId = role.id;
        userRole.assignedAt = Instant.now();
        userRole.persist();
        return userRole;
    }

    public static String issueToken(JwtTokenService jwtTokenService, SessionManager sessionManager,
                                    Person person, String role) {
        assignSystemRoleForClaim(person, role);
        String sessionId = sessionManager.createSession(person.userId(), "s2iam-test", "127.0.0.1");
        return jwtTokenService.generateAccessToken(
            person.userId(), person.email(), person.tenantId(), role, sessionId);
    }

    /**
     * TASK-267 retrofit: functional permission enforcement reads {@code user_roles}, so every
     * fixture token must map its role claim to the matching seeded system role, mirroring the
     * V2.0.1 mapping ({@code OWNER→TENANT_OWNER}, {@code ADMIN/TENANT_ADMIN→TENANT_ADMIN},
     * {@code MEMBER→STAFF}, {@code VIEWER→VIEWER}). This grants exactly the permissions of the
     * declared role (e.g. STAFF stays restricted) instead of weakening enforcement.
     */
    public static void assignSystemRoleForClaim(Person person, String roleClaim) {
        String code = switch (roleClaim == null ? "" : roleClaim.trim().toUpperCase()) {
            case "TENANT_OWNER", "OWNER" -> "TENANT_OWNER";
            case "TENANT_ADMIN", "ADMIN" -> "TENANT_ADMIN";
            case "MEMBER", "STAFF" -> "STAFF";
            case "VIEWER" -> "VIEWER";
            default -> null;
        };
        if (code == null) {
            return;
        }
        Runnable insert = () -> User.getEntityManager().createNativeQuery(
                "INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_at) "
                    + "SELECT ?1, ?2, r.id, NOW() FROM roles r "
                    + "WHERE r.tenant_id IS NULL AND r.code = ?3 "
                    + "ON CONFLICT (user_id, tenant_id, role_id) DO NOTHING")
            .setParameter(1, person.userId())
            .setParameter(2, person.tenantId())
            .setParameter(3, code)
            .executeUpdate();
        if (QuarkusTransaction.isActive()) {
            insert.run();
        } else {
            QuarkusTransaction.requiringNew().run(insert);
        }
    }

    public static String bearer(JwtTokenService jwtTokenService, SessionManager sessionManager,
                                Person person, String role) {
        return "Bearer " + issueToken(jwtTokenService, sessionManager, person, role);
    }

    // ------------------------------------------------------------------
    // Transactional variants for fixtures created inside a test method
    // (the REST call runs in its own transaction and must see committed rows).
    // ------------------------------------------------------------------

    public static Person createUserTx(UUID tenantId, String email, String fullName) {
        return QuarkusTransaction.requiringNew().call(() -> createUser(tenantId, email, fullName));
    }

    public static Tenant createTenantTx(String suffix) {
        return QuarkusTransaction.requiringNew().call(() -> createTenant(suffix));
    }

    public static Branch createBranchTx(UUID tenantId, String codeSuffix, String name) {
        return QuarkusTransaction.requiringNew().call(() -> createBranch(tenantId, codeSuffix, name));
    }

    public static Department createDepartmentTx(UUID tenantId, UUID branchId, UUID parentId, String codeSuffix) {
        return QuarkusTransaction.requiringNew().call(
            () -> createDepartment(tenantId, branchId, parentId, codeSuffix));
    }

    public static Role createCustomRoleTx(UUID tenantId, String codeSuffix, String name) {
        return QuarkusTransaction.requiringNew().call(() -> createCustomRole(tenantId, codeSuffix, name));
    }

    public static UserDepartmentMembership createMembershipTx(UUID tenantId, Person person, Branch branch,
                                                              Department department, UUID managerUserId,
                                                              boolean primary) {
        return QuarkusTransaction.requiringNew().call(
            () -> createMembership(tenantId, person, branch, department, managerUserId, primary));
    }

    public static UserBranchAssignment createBranchAssignmentTx(UUID tenantId, Person person, Branch branch,
                                                                boolean primary, boolean canManage) {
        return QuarkusTransaction.requiringNew().call(
            () -> createBranchAssignment(tenantId, person, branch, primary, canManage));
    }

    public static UserRole assignRoleTx(UUID tenantId, Person person, Role role) {
        return QuarkusTransaction.requiringNew().call(() -> assignRole(tenantId, person, role));
    }

    /**
     * Removes every row created by this wave (tagged with the {@code s2iam-} slug prefix).
     * Must be called inside an active transaction.
     */
    public static void cleanup() {
        List<Tenant> tenants = Tenant.find("slug like ?1", SLUG_PREFIX + "%").list();
        if (tenants.isEmpty()) {
            return;
        }
        List<UUID> tenantIds = tenants.stream().map(tenant -> tenant.id).toList();
        List<UUID> linkedUserIds = UserTenant.<UserTenant>find("id.tenantId in ?1", tenantIds).list().stream()
            .map(link -> link.id.userId)
            .toList();
        List<UUID> prefixedUserIds = User.<User>find("email like ?1", "s2iam%").list().stream()
            .map(user -> user.id)
            .toList();
        List<UUID> userIds = java.util.stream.Stream.concat(linkedUserIds.stream(), prefixedUserIds.stream())
            .distinct()
            .toList();

        EntityManager entityManager = Tenant.getEntityManager();
        deleteScopedAuditLogs(entityManager, tenantIds, userIds);
        deleteScopedImpersonationLogs(entityManager, tenantIds, userIds);
        deleteScopedSampleRecords(entityManager, tenantIds, userIds);

        UserBranchAssignment.delete("tenantId in ?1", tenantIds);
        UserDepartmentMembership.delete("tenantId in ?1", tenantIds);
        RoleDataPolicy.delete("tenantId in ?1", tenantIds);
        UserRole.delete("tenantId in ?1", tenantIds);
        List<UUID> roleIds = Role.<Role>find("tenantId in ?1", tenantIds).list().stream()
            .map(role -> role.id)
            .toList();
        if (!roleIds.isEmpty()) {
            RolePermission.delete("roleId in ?1", roleIds);
        }
        Department.delete("tenantId in ?1", tenantIds);
        Branch.delete("tenantId in ?1", tenantIds);
        Role.delete("tenantId in ?1", tenantIds);
        UserTenant.delete("id.tenantId in ?1", tenantIds);
        if (!userIds.isEmpty()) {
            UserProfile.delete("userId in ?1", userIds);
            UserCredential.delete("userId in ?1", userIds);
            User.delete("id in ?1", userIds);
        }
        Tenant.delete("id in ?1", tenantIds);
    }

    private static void deleteScopedAuditLogs(EntityManager entityManager, List<UUID> tenantIds,
                                              List<UUID> userIds) {
        @SuppressWarnings("unchecked")
        List<String> partitions = entityManager.createNativeQuery("""
                SELECT c.relname FROM pg_class c
                JOIN pg_inherits i ON i.inhrelid = c.oid
                JOIN pg_class p ON p.oid = i.inhparent
                WHERE p.relname = 'platform_audit_logs'
                """).getResultList().stream().map(Object::toString).toList();
        entityManager.createNativeQuery(
                "ALTER TABLE platform_audit_logs DISABLE TRIGGER USER").executeUpdate();
        for (String partition : partitions) {
            entityManager.createNativeQuery(
                "ALTER TABLE " + partition + " DISABLE TRIGGER USER").executeUpdate();
        }
        try {
            StringBuilder sql = new StringBuilder(
                "DELETE FROM platform_audit_logs WHERE tenant_id IN (:tenantIds) OR target_tenant_id IN (:tenantIds)");
            if (!userIds.isEmpty()) {
                sql.append(" OR actor_user_id IN (:userIds) OR target_user_id IN (:userIds)");
            }
            var query = entityManager.createNativeQuery(sql.toString());
            query.setParameter("tenantIds", tenantIds);
            if (!userIds.isEmpty()) {
                query.setParameter("userIds", userIds);
            }
            query.executeUpdate();
        } finally {
            for (String partition : partitions) {
                entityManager.createNativeQuery(
                    "ALTER TABLE " + partition + " ENABLE TRIGGER USER").executeUpdate();
            }
            entityManager.createNativeQuery(
                    "ALTER TABLE platform_audit_logs ENABLE TRIGGER USER").executeUpdate();
        }
    }

    private static void deleteScopedImpersonationLogs(EntityManager entityManager, List<UUID> tenantIds,
                                                      List<UUID> userIds) {
        String sql = "DELETE FROM platform_impersonation_logs WHERE target_tenant_id IN (:tenantIds)"
            + (userIds.isEmpty() ? "" : " OR super_admin_user_id IN (:userIds) OR target_user_id IN (:userIds)");
        var query = entityManager.createNativeQuery(sql);
        query.setParameter("tenantIds", tenantIds);
        if (!userIds.isEmpty()) {
            query.setParameter("userIds", userIds);
        }
        query.executeUpdate();
    }

    private static void deleteScopedSampleRecords(EntityManager entityManager, List<UUID> tenantIds,
                                                  List<UUID> userIds) {
        String sql = "DELETE FROM core_sample_records WHERE tenant_id IN (:tenantIds)"
            + (userIds.isEmpty() ? "" : " OR created_by IN (:userIds) OR assignee_id IN (:userIds)");
        var query = entityManager.createNativeQuery(sql);
        query.setParameter("tenantIds", tenantIds);
        if (!userIds.isEmpty()) {
            query.setParameter("userIds", userIds);
        }
        query.executeUpdate();
    }
}
