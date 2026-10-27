package com.vn9melody.openerp.modules.plugin.data;

import io.grpc.Status;

/**
 * Error raised inside the data gateway. The gRPC layer maps {@link #code()}
 * to an error code the plugin SDK can translate, never exposing SQL or driver
 * details to the plugin.
 */
public class PluginDataException extends RuntimeException {

    public enum Code {
        INVALID_IDENTITY(Status.Code.PERMISSION_DENIED),
        PLUGIN_NOT_ACTIVE(Status.Code.FAILED_PRECONDITION),
        QUERY_NOT_FOUND(Status.Code.PERMISSION_DENIED),
        INVALID_QUERY(Status.Code.FAILED_PRECONDITION),
        PARAM_MISSING(Status.Code.INVALID_ARGUMENT),
        PARAM_INVALID(Status.Code.INVALID_ARGUMENT),
        EXECUTION_FAILED(Status.Code.INTERNAL),
        UNAVAILABLE(Status.Code.UNAVAILABLE);

        private final Status.Code status;

        Code(Status.Code status) {
            this.status = status;
        }

        public Status.Code status() {
            return status;
        }
    }

    private final Code code;

    public PluginDataException(Code code, String message) {
        super(message);
        this.code = code;
    }

    public PluginDataException(Code code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public Code code() {
        return code;
    }

    public Status.Code status() {
        return code.status();
    }
}
