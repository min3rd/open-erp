package com.vn9melody.auth.dto;

public record LoginResponse(
                String accessToken,
                String refreshToken,
                String tokenType,
                long expiresInSeconds,
                UserProfileDto user) {
}
