package com.vn9melody.rest;

import org.jboss.resteasy.reactive.RestQuery;

import com.vn9melody.services.SampleService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Path("/sample")
public class SampleRest {
    @Inject
    SampleService sampleService;

    @GET
    public Response getAll() {
        return Response.ok(sampleService.listAll()).build();
    }

    @POST
    public Response create(@RestQuery String value) {
        return Response.ok(sampleService.create(value)).build();
    }
}
