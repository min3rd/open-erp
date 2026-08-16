package com.vn9melody.rest;

import org.jboss.resteasy.reactive.RestQuery;

import com.vn9melody.enums.PermissionCode;
import com.vn9melody.security.RequirePermission;
import com.vn9melody.security.UserContext;
import com.vn9melody.services.SampleService;

import io.quarkus.security.Authenticated;
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
    @RequirePermission(PermissionCode.ORDER_VIEW)
    public Response getAll() {
        return Response.ok(sampleService.listAll()).build();
    }

    @POST
    @RequirePermission(PermissionCode.ORDER_CREATE)
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
