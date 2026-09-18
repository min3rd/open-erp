package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SlugCheckResponse {
    @JsonProperty("slug")
    public String slug;

    @JsonProperty("available")
    public Boolean available;

    public SlugCheckResponse() {}

    public SlugCheckResponse(String slug, Boolean available) {
        this.slug = slug;
        this.available = available;
    }
}
