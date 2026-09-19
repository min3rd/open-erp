package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import java.util.UUID;

/** Authenticated platform caller extracted from the platform JWT by the filter. */
public class PlatformActor {

    public UUID userId;
    public String email;
    public PlatformAdminRole role;
    public String ipAddress = "unknown";
    public String userAgent;
    public ActorType explicitActorType;

    public static PlatformActor of(UUID userId, String email, PlatformAdminRole role, String ipAddress, String userAgent) {
        PlatformActor actor = new PlatformActor();
        actor.userId = userId;
        actor.email = email;
        actor.role = role;
        actor.ipAddress = ipAddress != null && !ipAddress.isBlank() ? ipAddress : "unknown";
        actor.userAgent = userAgent;
        return actor;
    }

    public ActorType actorType() {
        if (explicitActorType != null) {
            return explicitActorType;
        }
        return role == PlatformAdminRole.SUPPORT_ENGINEER ? ActorType.SUPPORT_ENGINEER : ActorType.SUPER_ADMIN;
    }
}
