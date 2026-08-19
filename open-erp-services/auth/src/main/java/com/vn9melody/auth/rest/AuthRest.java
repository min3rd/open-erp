package com.vn9melody.auth.rest;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.eclipse.microprofile.jwt.JsonWebToken;

import com.vn9melody.auth.dto.LoginRequest;
import com.vn9melody.auth.dto.LoginResponse;
import com.vn9melody.auth.dto.RefreshTokenRequest;
import com.vn9melody.auth.dto.UserProfileDto;
import com.vn9melody.auth.services.JwtTokenService;
import com.vn9melody.common.entity.User;

import io.quarkus.security.Authenticated;
import io.quarkus.security.UnauthorizedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AuthRest {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        if (request == null || request.username() == null || request.password() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Tên đăng nhập và mật khẩu là bắt buộc")
                    .build();
        }

        LoginResponse response = jwtTokenService.authenticate(request.username(), request.password());
        return Response.ok(response).build();
    }

    @POST
    @Path("/refresh")
    public Response refresh(RefreshTokenRequest request) {
        if (request == null || request.refreshToken() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Refresh token là bắt buộc")
                    .build();
        }

        LoginResponse response = jwtTokenService.refreshToken(request.refreshToken());
        return Response.ok(response).build();
    }

    @POST
    @Path("/logout")
    public Response logout(RefreshTokenRequest request) {
        if (request != null && request.refreshToken() != null) {
            jwtTokenService.revokeRefreshToken(request.refreshToken());
        }
        return Response.ok().entity("Đăng xuất thành công").build();
    }

    @GET
    @Path("/me")
    @Authenticated
    @Transactional
    public Response getCurrentUser() {
        String username = jwt.getName();
        if (username == null) {
            throw new UnauthorizedException("Chưa đăng nhập");
        }

        User user = User.<User>find("username = ?1 and isDeleted = false", username)
                .firstResultOptional()
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy thông tin người dùng"));

        UserProfileDto profile = new UserProfileDto(
                user.id,
                user.tenantId,
                user.username,
                user.email,
                user.department != null ? user.department.id : null,
                jwt.getGroups(),
                null);

        return Response.ok(profile).build();
    }

    @GET
    @Path("/public-key")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getPublicKey() {
        try (InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream("publicKey.pem")) {
            if (is == null) {
                return Response.status(Response.Status.NOT_FOUND).entity("Public key not found").build();
            }
            String key = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            return Response.ok(key).build();
        } catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }
}
