package com.vn9melody.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Path("/healthcheck")
public class HealthCheckRest {

    @GET
    public Response healthCheck() {
        return Response.ok("{" + "\"status\":\"UP\"" + "}").build();
    }
}
