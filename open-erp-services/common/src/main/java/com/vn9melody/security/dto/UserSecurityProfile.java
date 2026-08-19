package com.vn9melody.security.dto;

import java.util.List;
import java.util.UUID;

public record UserSecurityProfile(
                UUID userId,
                String tenantId,
                String username,
                UUID departmentId,
                List<PermissionScopeDto> permissions) {
}