package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record BackupCodesResponse(
    @JsonProperty("backup_codes") List<String> backupCodes
) {
}
