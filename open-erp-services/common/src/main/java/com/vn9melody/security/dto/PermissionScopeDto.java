package com.vn9melody.security.dto;

import com.vn9melody.common.enums.DataScope;
import com.vn9melody.common.enums.PermissionCode;
import java.util.List;

public record PermissionScopeDto(
                PermissionCode code,
                DataScope dataScope) {
}