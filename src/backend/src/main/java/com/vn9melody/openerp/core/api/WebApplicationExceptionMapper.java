package com.vn9melody.openerp.core.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.HashMap;
import java.util.List;
import org.jboss.logging.Logger;

@Provider
public class WebApplicationExceptionMapper implements ExceptionMapper<WebApplicationException> {
    private static final Logger LOG = Logger.getLogger(WebApplicationExceptionMapper.class);

    @Override
    public Response toResponse(WebApplicationException exception) {
        int status = exception.getResponse() != null
            ? exception.getResponse().getStatus()
            : Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();

        if (status == 400 && hasJsonProcessingCause(exception)) {
            LOG.debug("Malformed JSON request body handled");
            ApiErrorResponse malformed = new ApiErrorResponse(
                ErrorCode.VALIDATION_FAILED,
                "Request validation failed",
                new HashMap<>(),
                List.of(new ApiFieldError(null, ErrorCode.VALIDATION_MALFORMED_JSON, new HashMap<>()))
            );
            return Response.status(status).entity(malformed).build();
        }

        String code = switch (status) {
            case 400 -> ErrorCode.VALIDATION_FAILED;
            case 401 -> ErrorCode.UNAUTHORIZED;
            case 403 -> ErrorCode.FORBIDDEN;
            case 404 -> ErrorCode.NOT_FOUND;
            case 405 -> ErrorCode.METHOD_NOT_ALLOWED;
            case 415 -> ErrorCode.UNSUPPORTED_MEDIA_TYPE;
            default -> status >= 500 ? ErrorCode.INTERNAL_SERVER_ERROR : ErrorCode.BAD_REQUEST;
        };

        LOG.debugf("WebApplicationException handled: status=%d, code=%s", status, code);
        ApiErrorResponse error = new ApiErrorResponse(code, "Request could not be processed", null);
        return Response.status(status).entity(error).build();
    }

    private boolean hasJsonProcessingCause(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof JsonProcessingException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
