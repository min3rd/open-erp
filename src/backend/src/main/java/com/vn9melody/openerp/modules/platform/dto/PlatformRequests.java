package com.vn9melody.openerp.modules.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class PlatformRequests {

    public static class QuotaUpdate {
        @JsonProperty("plan_tier")
        public String planTier;

        @JsonProperty("max_users")
        public Integer maxUsers;

        @JsonProperty("max_storage_mb")
        public Integer maxStorageMb;

        @JsonProperty("allowed_plugins")
        public List<String> allowedPlugins;
    }

    public static class ReasonConfirm {
        public String reason;

        @JsonProperty("confirm_password")
        public String confirmPassword;
    }

    public static class Confirm {
        @JsonProperty("confirm_password")
        public String confirmPassword;
    }

    public static class Impersonate {
        @JsonProperty("target_user_id")
        public String targetUserId;

        @JsonProperty("support_ticket")
        public String supportTicket;

        public String reason;

        @JsonProperty("confirm_password")
        public String confirmPassword;
    }

    public static class AdminGrant {
        public String email;
        public String role;

        @JsonProperty("full_name")
        public String fullName;
    }

    public static class BreakGlass {
        public String action;

        @JsonProperty("support_ticket")
        public String supportTicket;

        public String reason;

        @JsonProperty("confirm_password")
        public String confirmPassword;
    }
}
