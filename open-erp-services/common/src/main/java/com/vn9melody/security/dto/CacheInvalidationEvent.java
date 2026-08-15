package com.vn9melody.security.dto;

public record CacheInvalidationEvent(
        String username,
        String reason // Ví dụ: "ROLE_CHANGED", "USER_LOCKED"
) {
}