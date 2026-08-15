package com.vn9melody.security.dto;

import com.vn9melody.enums.DataScope;
import com.vn9melody.enums.PermissionCode;
import java.util.List;

public record PermissionScopeDto(
        PermissionCode code,
        DataScope dataScope) {
}