package com.vn9melody.openerp.modules.core.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.UUID;

public class CreateSampleRecordRequest {

    @NotBlank
    @JsonProperty("title")
    public String title;

    @JsonProperty("amount")
    public BigDecimal amount;

    @JsonProperty("status")
    public String status;

    @JsonProperty("branch_id")
    public UUID branchId;

    @JsonProperty("department_id")
    public UUID departmentId;

    @JsonProperty("assignee_id")
    public UUID assigneeId;
}
