package com.vn9melody.openerp.plugin.sdk.api;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.Map;

@Provider
public class GenericExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        ApiException error = new ApiException(500, ErrorCode.INTERNAL_ERROR,
            "Unexpected catalog plugin error", Map.of());
        return Response.status(500)
            .type(MediaType.APPLICATION_JSON_TYPE)
            .entity(ApiErrorResponse.from(error))
            .build();
    }
}
