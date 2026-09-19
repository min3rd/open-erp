package com.vn9melody.openerp.modules.core.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class ShareSampleRecordRequest {

    @NotNull
    @JsonProperty("assignee_id")
    public UUID assigneeId;
}
