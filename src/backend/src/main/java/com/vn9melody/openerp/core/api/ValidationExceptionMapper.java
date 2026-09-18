package com.vn9melody.openerp.core.api;

import io.quarkus.hibernate.validator.runtime.jaxrs.ResteasyReactiveViolationException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.jboss.logging.Logger;

@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ResteasyReactiveViolationException> {
    private static final Logger LOG = Logger.getLogger(ValidationExceptionMapper.class);

    @Override
    public Response toResponse(ResteasyReactiveViolationException exception) {
        List<ApiFieldError> errors = new ArrayList<>();
        for (ConstraintViolation<?> violation : exception.getConstraintViolations()) {
            errors.add(toFieldError(violation));
        }

        LOG.debugf("Request validation failed: %d violation(s)", errors.size());
        ApiErrorResponse error = new ApiErrorResponse(
            ErrorCode.VALIDATION_FAILED,
            "Request validation failed",
            new HashMap<>(),
            errors
        );
        return Response.status(Response.Status.BAD_REQUEST).entity(error).build();
    }

    private ApiFieldError toFieldError(ConstraintViolation<?> violation) {
        String field = extractFieldName(violation.getPropertyPath().toString());
        Annotation annotation = violation.getConstraintDescriptor().getAnnotation();
        Map<String, Object> attributes = violation.getConstraintDescriptor().getAttributes();
        Map<String, Object> params = new HashMap<>();

        if (annotation instanceof Size) {
            if (attributes.containsKey("min")) {
                params.put("min", attributes.get("min"));
            }
            if (attributes.containsKey("max")) {
                params.put("max", attributes.get("max"));
            }
        } else if (annotation instanceof Min || annotation instanceof Max) {
            if (attributes.containsKey("value")) {
                params.put("value", attributes.get("value"));
            }
        }

        String code;
        String message = violation.getMessage();
        if (isStandardErrorCode(message)) {
            code = message;
        } else if (annotation instanceof NotBlank || annotation instanceof NotNull || annotation instanceof NotEmpty) {
            code = ErrorCode.VALIDATION_REQUIRED;
        } else if (annotation instanceof Email) {
            code = ErrorCode.VALIDATION_EMAIL;
        } else if (annotation instanceof Size) {
            code = ErrorCode.VALIDATION_SIZE;
        } else if (annotation instanceof Pattern) {
            code = ErrorCode.VALIDATION_PATTERN;
        } else if (annotation instanceof Min) {
            code = ErrorCode.VALIDATION_MIN;
        } else if (annotation instanceof Max) {
            code = ErrorCode.VALIDATION_MAX;
        } else {
            code = ErrorCode.VALIDATION_INVALID;
        }

        return new ApiFieldError(field, code, params);
    }

    private boolean isStandardErrorCode(String message) {
        return message != null && message.matches("^VALIDATION_[A-Z_]+$");
    }

    private String extractFieldName(String propertyPath) {
        if (propertyPath == null || propertyPath.isBlank()) {
            return null;
        }
        int lastDot = propertyPath.lastIndexOf('.');
        String leaf = lastDot >= 0 ? propertyPath.substring(lastDot + 1) : propertyPath;
        return toSnakeCase(leaf);
    }

    private String toSnakeCase(String value) {
        return value.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase();
    }
}
