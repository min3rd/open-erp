package com.vn9melody.openerp.modules.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import com.vn9melody.openerp.modules.platform.api.PlatformResponseKey;

public class PlatformRequests {

    public static class QuotaUpdate {
        @JsonProperty(PlatformResponseKey.Json.PLAN_TIER)
        public String planTier;

        @JsonProperty(PlatformResponseKey.Json.MAX_USERS)
        public Integer maxUsers;

        @JsonProperty(PlatformResponseKey.Json.MAX_STORAGE_MB)
        public Integer maxStorageMb;

        @JsonProperty(PlatformResponseKey.Json.ALLOWED_PLUGINS)
        public List<String> allowedPlugins;
    }

    public static class ReasonConfirm {
        public String reason;

        @JsonProperty(PlatformResponseKey.Json.CONFIRM_PASSWORD)
        public String confirmPassword;
    }

    public static class Confirm {
        @JsonProperty(PlatformResponseKey.Json.CONFIRM_PASSWORD)
        public String confirmPassword;
    }

    public static class Impersonate {
        @JsonProperty(PlatformResponseKey.Json.TARGET_USER_ID)
        public String targetUserId;

        @JsonProperty(PlatformResponseKey.Json.SUPPORT_TICKET)
        public String supportTicket;

        public String reason;

        @JsonProperty(PlatformResponseKey.Json.CONFIRM_PASSWORD)
        public String confirmPassword;
    }

    public static class AdminGrant {
        public String email;
        public String role;

        @JsonProperty(PlatformResponseKey.Json.FULL_NAME)
        public String fullName;
    }

    public static class BreakGlass {
        public String action;

        @JsonProperty(PlatformResponseKey.Json.SUPPORT_TICKET)
        public String supportTicket;

        public String reason;

        @JsonProperty(PlatformResponseKey.Json.CONFIRM_PASSWORD)
        public String confirmPassword;
    }
}
