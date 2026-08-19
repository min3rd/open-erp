package com.vn9melody.auth.dto;

import java.util.Set;
import java.util.UUID;

public record UserProfileDto(
                UUID userId,
                String tenantId,
                String username,
                String email,
                UUID departmentId,
                Set<String> roles,
                Set<String> permissions) {
}
