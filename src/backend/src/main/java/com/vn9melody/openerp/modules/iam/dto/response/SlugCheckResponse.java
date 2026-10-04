package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SlugCheckResponse(
    @JsonProperty("slug") String slug,
    @JsonProperty("available") Boolean available
) {
}
