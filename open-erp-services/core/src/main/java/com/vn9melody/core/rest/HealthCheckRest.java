package com.vn9melody.core.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/healthcheck")
public class HealthCheckRest {

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String healthCheck() {
        return "OK";
    }
}
