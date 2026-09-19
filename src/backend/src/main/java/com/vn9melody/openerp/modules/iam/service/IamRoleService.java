package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiFieldError;
import com.vn9melody.openerp.core.security.PermissionInvalidationService;
import com.vn9melody.openerp.core.security.events.RolePermissionChangedEvent;
import com.vn9melody.openerp.core.security.events.UserRoleAssignedEvent;
import com.vn9melody.openerp.modules.iam.model.Permission;
import com.vn9melody.openerp.modules.iam.model.Role;
import com.vn9melody.openerp.modules.iam.model.RolePermission;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserRole;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.iam.repository.PermissionRepository;
import com.vn9melody.openerp.modules.iam.repository.RolePermissionRepository;
import com.vn9melody.openerp.modules.iam.repository.RoleRepository;
import com.vn9melody.openerp.modules.iam.repository.UserRoleRepository;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.PermissionItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleRequest;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RolePermissionsUpdateResponse;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleUserItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleUsersAssignedResponse;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.UserRoleItem;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class IamRoleService {

    public static final String ROLE_TENANT_OWNER = "TENANT_OWNER";

    @Inject
    RoleRepository roleRepository;

    @Inject
    PermissionRepository permissionRepository;

    @Inject
    RolePermissionRepository rolePermissionRepository;

    @Inject
    UserRoleRepository userRoleRepository;

    @Inject
    EntityManager entityManager;

    @Inject
    PermissionInvalidationService permissionInvalidationService;

    public List<PermissionItem> listPermissions() {
        return permissionRepository.listAllOrdered().stream().map(this::toPermissionItem).toList();
    }

    public RoleListPage listRoles(UUID tenantId, int page, int size, String keyword) {
        List<Role> roles = roleRepository.listForTenant(tenantId);
        if (keyword != null && !keyword.isBlank()) {
            String term = keyword.trim().toLowerCase();
            roles = roles.stream()
                .filter(role -> role.code.toLowerCase().contains(term) || role.name.toLowerCase().contains(term))
                .toList();
        }
        Map<UUID, Long> counts = assignedUserCounts(tenantId);
        List<RoleItem> items = roles.stream()
            .map(role -> toRoleItem(role, counts.getOrDefault(role.id, 0L)))
            .toList();
        List<RoleItem> pageItems = paginate(items, page, size);
        return new RoleListPage(pageItems, page, size, items.size());
    }

    public RoleItem roleDetail(UUID tenantId, UUID roleId) {
        Role role = requireRole(tenantId, roleId);
        return toRoleItem(role, roleRepository.countUsersByRole(tenantId, roleId));
    }

    public List<PermissionItem> rolePermissions(UUID tenantId, UUID roleId) {
        requireRole(tenantId, roleId);
        List<UUID> permissionIds = rolePermissionRepository.listByRole(roleId).stream()
            .map(rolePermission -> rolePermission.permissionId)
            .toList();
        if (permissionIds.isEmpty()) {
            return List.of();
        }
        return Permission.<Permission>find("id in ?1 order by domain asc, resource asc, action asc", permissionIds)
            .list()
            .stream()
            .map(this::toPermissionItem)
            .toList();
    }

    public Role requireRole(UUID tenantId, UUID roleId) {
        Role role = roleRepository.find("(tenantId = ?1 or tenantId is null) and id = ?2", tenantId, roleId)
            .firstResult();
        if (role == null) {
            throw new ApiException(404, IamErrorCodes.ROLE_NOT_FOUND, "Role not found");
        }
        return role;
    }

    @Transactional
    public RoleItem createRole(UUID tenantId, RoleRequest request) {
        String code = normalizeCode(request.code());
        if (roleRepository.findByTenantAndCode(tenantId, code) != null
                || roleRepository.findSystemByCode(code) != null) {
            throw new ApiException(409, IamErrorCodes.ROLE_CODE_EXISTS,
                "Role code already exists in this tenant");
        }

        Role role = new Role();
        role.tenantId = tenantId;
        role.code = code;
        role.name = request.name().trim();
        role.description = request.description();
        role.isSystem = false;
        role.createdAt = Instant.now();
        role.updatedAt = role.createdAt;
        role.persist();

        // TODO(wave-integration): emit tenant-scoped audit log for IAM_ROLE_CREATED.
        return toRoleItem(role, 0L);
    }

    @Transactional
    public RoleItem updateRole(UUID tenantId, UUID roleId, RoleRequest request) {
        Role role = requireTenantRole(tenantId, roleId);
        String code = normalizeCode(request.code());
        Role existing = roleRepository.findByTenantAndCode(tenantId, code);
        if (existing != null && !existing.id.equals(role.id)) {
            throw new ApiException(409, IamErrorCodes.ROLE_CODE_EXISTS,
                "Role code already exists in this tenant");
        }
        role.code = code;
        role.name = request.name().trim();
        role.description = request.description();
        role.updatedAt = Instant.now();

        // TODO(wave-integration): emit tenant-scoped audit log for IAM_ROLE_UPDATED.
        return toRoleItem(role, roleRepository.countUsersByRole(tenantId, role.id));
    }

    @Transactional
    public void deleteRole(UUID tenantId, UUID roleId) {
        Role role = requireTenantRole(tenantId, roleId);
        if (roleRepository.countUsersByRole(tenantId, roleId) > 0) {
            throw new ApiException(409, IamErrorCodes.ROLE_IN_USE,
                "Cannot delete a role that is assigned to users");
        }
        role.delete();
        // TODO(wave-integration): emit tenant-scoped audit log for IAM_ROLE_DELETED.
    }

    @Transactional
    public RolePermissionsUpdateResponse updateRolePermissions(UUID tenantId, UUID roleId,
                                                               List<String> permissionEntries) {
        requireRole(tenantId, roleId);
        List<Permission> resolved = new ArrayList<>();
        List<String> unknown = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        if (permissionEntries != null) {
            for (String entry : permissionEntries) {
                Permission permission = resolvePermission(entry);
                if (permission == null) {
                    unknown.add(entry);
                } else if (seen.add(permission.id)) {
                    resolved.add(permission);
                }
            }
        }
        if (!unknown.isEmpty()) {
            throw new ApiException(400, IamErrorCodes.PERMISSION_UNKNOWN,
                "One or more permission codes are not part of the catalog",
                Map.of("unknown_permissions", unknown),
                List.of(new ApiFieldError("permission_ids", IamErrorCodes.PERMISSION_UNKNOWN,
                    Map.of("unknown_permissions", unknown))));
        }

        rolePermissionRepository.deleteByRole(roleId);
        for (Permission permission : resolved) {
            RolePermission rolePermission = new RolePermission();
            rolePermission.roleId = roleId;
            rolePermission.permissionId = permission.id;
            rolePermission.grantedAt = Instant.now();
            rolePermission.persist();
        }

        List<UUID> affected = userRoleRepository.listUserIdsByRole(tenantId, roleId);
        permissionInvalidationService.publish(
            new RolePermissionChangedEvent(tenantId, roleId, affected, "ROLE_PERMISSIONS_UPDATED"));
        // TODO(wave-integration): emit tenant-scoped audit log for IAM_ROLE_PERMISSIONS_UPDATED.
        return new RolePermissionsUpdateResponse(roleId.toString(), resolved.size());
    }

    public List<RoleUserItem> roleUsers(UUID tenantId, UUID roleId) {
        requireRole(tenantId, roleId);
        List<UserRole> userRoles = userRoleRepository.list("tenantId = ?1 and roleId = ?2", tenantId, roleId);
        Set<UUID> userIds = new LinkedHashSet<>();
        for (UserRole userRole : userRoles) {
            userIds.add(userRole.userId);
        }
        Map<UUID, User> users = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User user : User.<User>find("id in ?1", userIds).list()) {
                users.put(user.id, user);
            }
        }
        Map<UUID, UserProfile> profiles = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (UserProfile profile : UserProfile.<UserProfile>find("userId in ?1", userIds).list()) {
                profiles.put(profile.userId, profile);
            }
        }
        List<RoleUserItem> items = new ArrayList<>();
        for (UserRole userRole : userRoles) {
            User user = users.get(userRole.userId);
            UserProfile profile = profiles.get(userRole.userId);
            items.add(new RoleUserItem(
                userRole.userId.toString(),
                user != null ? user.email : null,
                profile != null ? profile.fullName : null,
                user != null && user.status != null ? user.status.name() : null,
                userRole.assignedAt != null ? userRole.assignedAt.toString() : null
            ));
        }
        return items;
    }

    @Transactional
    public RoleUsersAssignedResponse assignUsersToRole(UUID tenantId, UUID roleId, List<String> userIdEntries,
                                                       UUID actorUserId) {
        requireRole(tenantId, roleId);
        int assigned = 0;
        if (userIdEntries != null) {
            Set<UUID> distinct = new LinkedHashSet<>();
            for (String entry : userIdEntries) {
                distinct.add(parseUuid(entry, "user_ids"));
            }
            for (UUID userId : distinct) {
                requireUserInTenant(tenantId, userId);
                if (userRoleRepository.findAssignment(userId, tenantId, roleId) != null) {
                    continue;
                }
                UserRole userRole = new UserRole();
                userRole.userId = userId;
                userRole.tenantId = tenantId;
                userRole.roleId = roleId;
                userRole.assignedAt = Instant.now();
                userRole.assignedBy = actorUserId;
                userRole.persist();
                assigned++;
                permissionInvalidationService.publish(
                    new UserRoleAssignedEvent(tenantId, userId, roleId, true, "ROLE_USERS_ASSIGNED"));
            }
        }
        // TODO(wave-integration): emit tenant-scoped audit log for IAM_USER_ROLES_ASSIGNED.
        return new RoleUsersAssignedResponse(roleId.toString(), assigned);
    }

    @Transactional
    public void removeUserFromRole(UUID tenantId, UUID roleId, UUID userId) {
        Role role = requireRole(tenantId, roleId);
        UserRole userRole = userRoleRepository.findAssignment(userId, tenantId, roleId);
        if (userRole == null) {
            throw new ApiException(404, IamErrorCodes.USER_ROLE_NOT_FOUND, "The user does not have this role");
        }
        if (ROLE_TENANT_OWNER.equalsIgnoreCase(role.code)
                && userRoleRepository.countByRole(tenantId, roleId) <= 1) {
            throw new ApiException(409, IamErrorCodes.USER_ROLE_REQUIRED,
                "Cannot remove the last TENANT_OWNER role of the tenant");
        }
        userRole.delete();
        permissionInvalidationService.publish(
            new UserRoleAssignedEvent(tenantId, userId, roleId, false, "ROLE_USER_REMOVED"));
        // TODO(wave-integration): emit tenant-scoped audit log for IAM_USER_ROLE_REMOVED.
    }

    @Transactional
    public IamRbacDtos.UserRolesAssignedResponse assignRolesToUser(UUID tenantId, UUID userId,
                                                                   List<String> roleEntries, UUID actorUserId) {
        requireUserInTenant(tenantId, userId);
        int assigned = 0;
        if (roleEntries != null) {
            Set<UUID> distinct = new LinkedHashSet<>();
            for (String entry : roleEntries) {
                distinct.add(parseUuid(entry, "role_ids"));
            }
            for (UUID roleId : distinct) {
                requireRole(tenantId, roleId);
                if (userRoleRepository.findAssignment(userId, tenantId, roleId) != null) {
                    continue;
                }
                UserRole userRole = new UserRole();
                userRole.userId = userId;
                userRole.tenantId = tenantId;
                userRole.roleId = roleId;
                userRole.assignedAt = Instant.now();
                userRole.assignedBy = actorUserId;
                userRole.persist();
                assigned++;
                permissionInvalidationService.publish(
                    new UserRoleAssignedEvent(tenantId, userId, roleId, true, "USER_ROLES_ASSIGNED"));
            }
        }
        // TODO(wave-integration): emit tenant-scoped audit log for IAM_USER_ROLES_ASSIGNED.
        return new IamRbacDtos.UserRolesAssignedResponse(userId.toString(), assigned);
    }

    public List<UserRoleItem> userRoles(UUID tenantId, UUID userId) {        requireUserInTenant(tenantId, userId);
        List<UserRole> userRoles = userRoleRepository.listByUser(userId, tenantId);
        if (userRoles.isEmpty()) {
            return List.of();
        }
        Map<UUID, Role> roles = new HashMap<>();
        for (Role role : Role.<Role>find("id in ?1", userRoles.stream().map(item -> item.roleId).toList()).list()) {
            roles.put(role.id, role);
        }
        List<UserRoleItem> items = new ArrayList<>();
        for (UserRole userRole : userRoles) {
            Role role = roles.get(userRole.roleId);
            if (role == null) {
                continue;
            }
            items.add(new UserRoleItem(
                role.id.toString(),
                role.code,
                role.name,
                role.isSystem,
                userRole.assignedAt != null ? userRole.assignedAt.toString() : null
            ));
        }
        return items;
    }

    public void requireUserInTenant(UUID tenantId, UUID userId) {
        if (UserTenant.findByUserAndTenant(userId, tenantId) == null) {
            throw new ApiException(404, IamErrorCodes.USER_NOT_FOUND,
                "User not found in the current tenant");
        }
    }

    private Role requireTenantRole(UUID tenantId, UUID roleId) {
        Role role = requireRole(tenantId, roleId);
        if (Boolean.TRUE.equals(role.isSystem) || role.tenantId == null) {
            throw new ApiException(409, IamErrorCodes.SYSTEM_ROLE_IMMUTABLE,
                "System roles cannot be modified or deleted");
        }
        return role;
    }

    private Permission resolvePermission(String entry) {
        if (entry == null || entry.isBlank()) {
            return null;
        }
        String value = entry.trim();
        try {
            UUID id = UUID.fromString(value);
            return Permission.findById(id);
        } catch (IllegalArgumentException e) {
            return permissionRepository.findByCode(value);
        }
    }

    private Map<UUID, Long> assignedUserCounts(UUID tenantId) {
        List<Object[]> rows = entityManager.createQuery(
                "select ur.roleId, count(ur) from UserRole ur where ur.tenantId = ?1 group by ur.roleId",
                Object[].class)
            .setParameter(1, tenantId)
            .getResultList();
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    private PermissionItem toPermissionItem(Permission permission) {
        return new PermissionItem(
            permission.id.toString(),
            permission.code,
            permission.domain,
            permission.resource,
            permission.action,
            permission.descriptionKey
        );
    }

    private RoleItem toRoleItem(Role role, Long assignedUsersCount) {
        return new RoleItem(
            role.id.toString(),
            role.code,
            role.name,
            role.description,
            role.isSystem,
            assignedUsersCount
        );
    }

    private List<RoleItem> paginate(List<RoleItem> items, int page, int size) {
        int from = Math.max(0, page) * Math.max(1, size);
        if (from >= items.size()) {
            return List.of();
        }
        int to = Math.min(items.size(), from + Math.max(1, size));
        return items.subList(from, to);
    }

    private UUID parseUuid(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", field + " is required");
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, "VALIDATION_INVALID_FORMAT", "Invalid UUID value for " + field);
        }
    }

    public static String normalizeCode(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "Role code is required");
        }
        return value.trim().toUpperCase();
    }

    public record RoleListPage(List<RoleItem> items, int page, int size, long totalItems) {
    }
}
