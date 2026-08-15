package com.vn9melody.security.dto;

import java.util.List;

public record UserSecurityProfile(
        Long userId,
        String tenantId,
        String username,
        Long departmentId,
        List<PermissionScopeDto> permissions) {
}