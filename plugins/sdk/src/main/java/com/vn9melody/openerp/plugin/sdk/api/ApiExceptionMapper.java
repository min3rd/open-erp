package com.vn9melody.openerp.plugin.sdk.api;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ApiExceptionMapper implements ExceptionMapper<ApiException> {

    @Override
    public Response toResponse(ApiException exception) {
        return Response.status(exception.getStatusCode())
            .type(MediaType.APPLICATION_JSON_TYPE)
            .entity(ApiErrorResponse.from(exception))
            .build();
    }
}
