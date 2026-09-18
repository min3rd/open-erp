package com.vn9melody.openerp.core.api;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {
    private static final Logger LOG = Logger.getLogger(GlobalExceptionMapper.class);

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof ApiException apiEx) {
            LOG.debugf("ApiException handled: code=%s, status=%d, message=%s", 
                apiEx.getCode(), apiEx.getStatusCode(), apiEx.getMessage());
            ApiErrorResponse error = new ApiErrorResponse(apiEx.getCode(), apiEx.getMessage(), apiEx.getParams());
            return Response.status(apiEx.getStatusCode()).entity(error).build();
        }

        LOG.error("Unhandled exception caught by GlobalExceptionMapper", exception);
        ApiErrorResponse fallback = new ApiErrorResponse(
            ErrorCode.INTERNAL_SERVER_ERROR, 
            "An unexpected internal error occurred"
        );
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(fallback).build();
    }
}
