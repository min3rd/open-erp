package com.vn9melody.openerp.plugin.sdk.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.InputStream;
import java.util.Map;

/**
 * Serves the plugin web bundle shipped in META-INF/resources. Bundle images
 * repack web assets into the jar, and the default Quarkus static handler is not
 * available in every embedded runtime, so this tiny fallback keeps /main.js and
 * /styles.css reachable for the Core plugin gateway.
 */
@Path("/")
public class PluginUiResource {

    private static final Map<String, String> TYPES = Map.of(
            "js", "text/javascript; charset=utf-8",
            "css", "text/css; charset=utf-8",
            "json", "application/json; charset=utf-8",
            "html", "text/html; charset=utf-8",
            "ico", "image/x-icon",
            "svg", "image/svg+xml",
            "png", "image/png",
            "woff2", "font/woff2");

    @GET
    @Path("{path: .+}")
    @Produces(MediaType.WILDCARD)
    public Response file(@PathParam("path") String path) {
        if (path == null || path.isBlank() || path.contains("..")) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        String resource = "META-INF/resources/" + path;
        InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(resource);
        if (stream == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        String extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
        String type = TYPES.getOrDefault(extension, "application/octet-stream");
        return Response.ok(stream).type(type).build();
    }
}
