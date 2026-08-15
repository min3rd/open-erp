package com.vn9melody.security;

import com.vn9melody.entities.RolePermission;
import com.vn9melody.entities.User;
import com.vn9melody.enums.DataScope;
import com.vn9melody.enums.PermissionCode;
import io.quarkus.cache.CacheResult;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PermissionService {

    /**
     * Cache kết quả theo username. Khi phân quyền thay đổi, có thể
     * dùng @CacheInvalidate.
     */
    @CacheResult(cacheName = "user-permissions-cache")
    public UserSecurityDto getUserSecurityProfile(String username) {
        User user = User.<User>find("username = ?1 and isDeleted = false", username)
                .firstResultOptional()
                .orElse(null);

        if (user == null) {
            return null;
        }

        // Lấy toàn bộ RolePermission của các Role gán cho User
        List<RolePermission> rolePermissions = RolePermission.find(
                "role.id in (select r.id from saas_users u join u.roles r where u.id = ?1) and isDeleted = false",
                user.id).list();

        return new UserSecurityDto(
                user.id,
                user.tenantId,
                user.username,
                user.department != null ? user.department.id : null,
                rolePermissions);
    }

    /**
     * Resolve DataScope lớn nhất nếu user có nhiều role chứa cùng 1 Permission (ALL
     * > DEPARTMENT > PERSONAL)
     */
    public Optional<DataScope> resolveDataScope(UserSecurityDto profile, PermissionCode requiredPermission) {
        List<DataScope> scopes = profile.rolePermissions.stream()
                .filter(rp -> rp.permission.code == requiredPermission)
                .map(rp -> rp.dataScope)
                .toList();

        if (scopes.isEmpty()) {
            return Optional.empty(); // Không có quyền
        }

        if (scopes.contains(DataScope.ALL)) {
            return Optional.of(DataScope.ALL);
        }
        if (scopes.contains(DataScope.DEPARTMENT)) {
            return Optional.of(DataScope.DEPARTMENT);
        }
        return Optional.of(DataScope.PERSONAL);
    }

    public record UserSecurityDto(
            Long userId,
            String tenantId,
            String username,
            Long departmentId,
            List<RolePermission> rolePermissions) {
    }
}