package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.modules.iam.dto.response.TenantUiPreferencesResponse;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Tenant workspace UI preferences (Sprint 04, TASK-357): the theme is a
 * per-tenant setting applied to every user of the tenant. The light/dark mode
 * stays a per-user browser preference and is not stored here.
 */
@ApplicationScoped
public class TenantUiPreferencesService {

    /** Registry of theme ids the frontend can render. */
    public static final List<String> AVAILABLE_THEMES =
            List.of("industrial", "slate-blue", "emerald", "amber");

    public static final String DEFAULT_THEME = "industrial";

    @Inject
    AuditTrail auditTrail;

    public TenantUiPreferencesResponse get(UUID tenantId) {
        return response(currentTheme(requireTenant(tenantId)));
    }

    @Transactional
    public TenantUiPreferencesResponse update(UUID tenantId, String theme, UUID actorId) {
        Tenant tenant = requireTenant(tenantId);
        String normalized = theme == null ? "" : theme.trim();
        if (!AVAILABLE_THEMES.contains(normalized)) {
            throw new ApiException(400, ErrorCode.TENANT_UI_PREFERENCES_INVALID_THEME,
                    "Unsupported theme: " + theme);
        }
        tenant.uiTheme = normalized;
        tenant.updatedAt = Instant.now();
        auditTrail.recordSuccess(tenantId, PlatformAction.TENANT_UI_THEME_UPDATED, "TENANT", tenantId,
                Map.of("theme", normalized));
        return response(normalized);
    }

    private Tenant requireTenant(UUID tenantId) {
        Tenant tenant = tenantId == null ? null : Tenant.findById(tenantId);
        if (tenant == null) {
            throw new ApiException(404, ErrorCode.TENANT_NOT_FOUND, "Tenant not found");
        }
        return tenant;
    }

    private String currentTheme(Tenant tenant) {
        return tenant.uiTheme == null || tenant.uiTheme.isBlank() ? DEFAULT_THEME : tenant.uiTheme;
    }

    private TenantUiPreferencesResponse response(String theme) {
        return new TenantUiPreferencesResponse(theme, AVAILABLE_THEMES);
    }
}
