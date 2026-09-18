package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class BackupCodesResponse {
    @JsonProperty("backup_codes")
    public List<String> backupCodes;

    public BackupCodesResponse() {}

    public BackupCodesResponse(List<String> backupCodes) {
        this.backupCodes = backupCodes;
    }
}
