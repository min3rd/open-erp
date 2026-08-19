package com.vn9melody.sample.rest;

import org.jboss.resteasy.reactive.RestQuery;

import com.vn9melody.sample.services.SampleService;
import com.vn9melody.security.UserContext;

import io.quarkus.security.Authenticated;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/sample")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class SampleRest {

    @Inject
    SampleService sampleService;

    @Inject
    UserContext userContext;

    @GET
    @PermitAll
    public Response getAll() {
        return Response.ok(sampleService.listAll()).build();
    }

    @POST
    @PermitAll
    public Response create(@RestQuery String value) {
        return Response.ok(sampleService.create(value)).build();
    }

    @GET
    @Path("/current-context")
    @Authenticated
    public Response getCurrentContext() {
        return Response.ok(userContext).build();
    }
}
