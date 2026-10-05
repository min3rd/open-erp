package com.vn9melody.openerp.modules.plugin.artifact;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import com.vn9melody.openerp.core.api.ApiException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-331: OCI registry v2 digest resolution with the token auth flow.
 * The token flow runs against a real JDK HTTP server; the happy path also runs
 * against the dev {@code registry:2} when it is up (skipped otherwise).
 */
public class OciRegistryClientTest {

    private static final String MANIFEST =
            "{\"schemaVersion\":2,\"mediaType\":\"application/vnd.oci.image.manifest.v1+json\"}";

    private OciRegistryClient client(boolean allowHttp) {
        OciRegistryClient client = new OciRegistryClient();
        client.timeoutSeconds = 10;
        client.maxManifestBytes = 4 * 1024 * 1024;
        client.allowHttp = allowHttp;
        client.objectMapper = new ObjectMapper();
        return client;
    }

    private static String sha256(String value) throws Exception {
        return "sha256:" + HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    }

    private static String sha256(byte[] value) throws Exception {
        return "sha256:" + HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value));
    }

    @Test
    @DisplayName("TASK-331: parse Docker Hub / registry image references")
    public void parsesImageReferences() {
        OciRegistryClient.RegistryRef official = OciRegistryClient.parseDockerHubRef("nginx", null);
        assertEquals("registry-1.docker.io", official.host());
        assertEquals("library/nginx", official.repository());
        assertEquals("latest", official.reference());

        OciRegistryClient.RegistryRef tagged = OciRegistryClient.parseDockerHubRef("open-erp/sales:1.3.0", null);
        assertEquals("open-erp/sales", tagged.repository());
        assertEquals("1.3.0", tagged.reference());

        OciRegistryClient.RegistryRef hostPort = OciRegistryClient.parseDockerHubRef("localhost:5001/foo/bar:2", null);
        assertEquals("localhost:5001", hostPort.host());
        assertEquals("foo/bar", hostPort.repository());
        assertEquals("2", hostPort.reference());
    }

    @Test
    @DisplayName("TASK-331: token auth flow (401 challenge -> token -> Bearer retry)")
    public void resolvesDigestThroughTokenFlow() throws Exception {
        String digest = sha256(MANIFEST);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        int port = server.getAddress().getPort();
        server.createContext("/v2/", exchange -> {
            boolean authed = "Bearer t0ken".equals(exchange.getRequestHeaders().getFirst("Authorization"));
            if (!authed) {
                exchange.getResponseHeaders().add("WWW-Authenticate",
                        "Bearer realm=\"http://127.0.0.1:" + port
                                + "/token\",service=\"stub\",scope=\"repository:team/app:pull\"");
                exchange.sendResponseHeaders(401, -1);
                exchange.close();
                return;
            }
            exchange.getResponseHeaders().add("Docker-Content-Digest", digest);
            byte[] body = MANIFEST.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(body);
            }
        });
        server.createContext("/token", exchange -> {
            byte[] body = "{\"token\":\"t0ken\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(body);
            }
        });
        server.start();
        try {
            OciRegistryClient.RegistryRef ref = new OciRegistryClient.RegistryRef(
                    "127.0.0.1:" + port, "team/app", "1.0.0");
            assertEquals(digest, client(true).resolveDigest(ref, null));
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("TASK-331: an unsupported auth scheme fails closed")
    public void rejectsUnauthenticatedRegistry() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v2/", exchange -> {
            exchange.getResponseHeaders().add("WWW-Authenticate", "Basic realm=\"nope\"");
            exchange.sendResponseHeaders(401, -1);
            exchange.close();
        });
        server.start();
        int port = server.getAddress().getPort();
        try {
            OciRegistryClient.RegistryRef ref = new OciRegistryClient.RegistryRef("127.0.0.1:" + port, "x", "1");
            assertThrows(ApiException.class, () -> client(true).resolveDigest(ref, null));
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("TASK-331: resolve digest from a real local registry:2")
    public void resolvesDigestFromLocalRegistry() throws Exception {
        assumeTrue(reachable("127.0.0.1", 5001), "local registry:2 not running (npm run infra:registry)");
        String repository = "openerp/oci-test";
        byte[] config = "{}".getBytes(StandardCharsets.UTF_8);
        byte[] layer = "[]".getBytes(StandardCharsets.UTF_8);
        HttpClient http = HttpClient.newHttpClient();
        String configDigest = sha256(config);
        String layerDigest = sha256(layer);
        assumeTrue(pushBlob(http, repository, configDigest, config), "cannot push config blob to the local registry");
        assumeTrue(pushBlob(http, repository, layerDigest, layer), "cannot push layer blob to the local registry");

        String manifest = "{\"schemaVersion\":2,"
                + "\"mediaType\":\"application/vnd.oci.image.manifest.v1+json\","
                + "\"config\":{\"mediaType\":\"application/vnd.oci.image.config.v1+json\","
                + "\"digest\":\"" + configDigest + "\",\"size\":" + config.length + "},"
                + "\"layers\":[{\"mediaType\":\"application/vnd.oci.image.layer.v1.tar\","
                + "\"digest\":\"" + layerDigest + "\",\"size\":" + layer.length + "}]}";
        byte[] manifestBytes = manifest.getBytes(StandardCharsets.UTF_8);
        String expected = sha256(manifestBytes);
        HttpResponse<Void> pushed = http.send(HttpRequest.newBuilder(
                        URI.create("http://127.0.0.1:5001/v2/" + repository + "/manifests/1.0.0"))
                .header("Content-Type", "application/vnd.oci.image.manifest.v1+json")
                .PUT(HttpRequest.BodyPublishers.ofByteArray(manifestBytes)).build(),
                HttpResponse.BodyHandlers.discarding());
        assumeTrue(pushed.statusCode() == 201 || pushed.statusCode() == 200,
                "cannot push to the local registry (status " + pushed.statusCode() + ")");

        OciRegistryClient.RegistryRef ref = new OciRegistryClient.RegistryRef("127.0.0.1:5001", repository, "1.0.0");
        String resolved = client(true).resolveDigest(ref, null);
        assertEquals(expected, resolved);
        assertTrue(resolved.startsWith("sha256:"));
    }

    private boolean pushBlob(HttpClient http, String repository, String digest, byte[] body) throws Exception {
        HttpResponse<Void> start = http.send(HttpRequest.newBuilder(
                        URI.create("http://127.0.0.1:5001/v2/" + repository + "/blobs/uploads/"))
                .POST(HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.discarding());
        String location = start.headers().firstValue("Location").orElse(null);
        if (location == null) {
            return false;
        }
        if (!location.startsWith("http")) {
            location = "http://127.0.0.1:5001" + location;
        }
        String url = location + (location.contains("?") ? "&" : "?") + "digest=" + digest;
        HttpResponse<Void> response = http.send(HttpRequest.newBuilder(URI.create(url))
                        .header("Content-Type", "application/octet-stream")
                        .PUT(HttpRequest.BodyPublishers.ofByteArray(body)).build(),
                HttpResponse.BodyHandlers.discarding());
        return response.statusCode() == 201 || response.statusCode() == 202 || response.statusCode() == 200;
    }

    private boolean reachable(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 500);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
