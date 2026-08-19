package com.vn9melody.auth.dto;

import java.util.Set;

public record UserProfileDto(
                Long userId,
                String tenantId,
                String username,
                String email,
                Long departmentId,
                Set<String> roles,
                Set<String> permissions) {
}
