package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.modules.iam.dto.UserUiPreferencesUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.response.UserUiPreferencesResponse;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Per-user UI preferences (Sprint 04, TASK-369): theme/shape/layout/mode are
 * stored on the user account as overrides. A null value means "follow the
 * tenant/default", so the tenant theme stays a tenant-level setting.
 */
@ApplicationScoped
public class UserUiPreferencesService {

    /** Registries of ids the frontend can render; themes reuse the tenant registry. */
    public static final List<String> AVAILABLE_SHAPES = List.of("sharp", "soft", "rounded");

    /**
     * Menu layouts: the axis is vertical vs horizontal placement only — how the
     * menu is displayed (expanded/collapsed) is a control inside the menu, not a
     * separate layout.
     */
    public static final List<String> AVAILABLE_LAYOUTS =
            List.of("side", "top", "right", "drawer");

    public static final List<String> AVAILABLE_MODES = List.of("SYSTEM", "LIGHT", "DARK");

    @Inject
    AuditTrail auditTrail;

    public UserUiPreferencesResponse get(UUID userId, UUID tenantId) {
        return response(requireUser(userId), tenantTheme(tenantId));
    }

    @Transactional
    public UserUiPreferencesResponse update(UUID userId, UUID tenantId, UserUiPreferencesUpdateRequest request) {
        User user = requireUser(userId);
        String theme = normalize(request.theme, TenantUiPreferencesService.AVAILABLE_THEMES, "theme");
        String shape = normalize(request.shape, AVAILABLE_SHAPES, "shape");
        String layout = normalize(request.layout, AVAILABLE_LAYOUTS, "layout");
        String mode = normalize(request.mode, AVAILABLE_MODES, "mode");

        user.uiTheme = theme;
        user.uiShape = shape;
        user.uiLayout = layout;
        user.uiMode = mode;
        user.updatedAt = Instant.now();

        Map<String, Object> details = new LinkedHashMap<>();
        if (theme != null) details.put("theme", theme);
        if (shape != null) details.put("shape", shape);
        if (layout != null) details.put("layout", layout);
        if (mode != null) details.put("mode", mode);
        auditTrail.recordSuccess(tenantId, PlatformAction.USER_UI_PREFERENCES_UPDATED, "USER", userId, details);

        return response(user, tenantTheme(tenantId));
    }

    private User requireUser(UUID userId) {
        User user = userId == null ? null : User.findById(userId);
        if (user == null) {
            throw new ApiException(404, IamErrorCodes.USER_NOT_FOUND, "User not found");
        }
        return user;
    }

    private String tenantTheme(UUID tenantId) {
        Tenant tenant = tenantId == null ? null : Tenant.findById(tenantId);
        if (tenant == null || tenant.uiTheme == null || tenant.uiTheme.isBlank()) {
            return TenantUiPreferencesService.DEFAULT_THEME;
        }
        return tenant.uiTheme;
    }

    private String normalize(String value, List<String> registry, String field) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (!registry.contains(normalized)) {
            throw new ApiException(400, ErrorCode.USER_UI_PREFERENCES_INVALID_VALUE,
                    "Unsupported " + field + ": " + value);
        }
        return normalized;
    }

    private UserUiPreferencesResponse response(User user, String tenantTheme) {
        return new UserUiPreferencesResponse(user.uiTheme, user.uiShape, user.uiLayout, user.uiMode, tenantTheme);
    }
}
