package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Map;
import java.util.UUID;

/**
 * Maps the authenticated user to the attendance employee projection. Requests,
 * leave balances and records are keyed by employee_id, not user_id.
 */
@ApplicationScoped
public class AttendanceEmployeeResolver {

    @Inject
    PluginDataClient client;

    public UUID resolve(UUID userId) {
        if (userId == null) {
            return null;
        }
        try {
            PluginQueryResult result = client.query("attendance.employee_ref.get_by_user_id",
                    Map.of("user_id", userId.toString()));
            if (!result.rows().isEmpty()) {
                Object employeeId = result.rows().get(0).get("employee_id");
                if (employeeId != null) {
                    return UUID.fromString(employeeId.toString());
                }
            }
        } catch (RuntimeException ignored) {
            // Projection not synced yet: fall back to the user id.
        }
        return userId;
    }
}
