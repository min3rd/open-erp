package com.vn9melody.security;

import java.util.Collections;
import java.util.Set;

import com.vn9melody.enums.DataScope;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class UserContext {
    public String tenantId;
    public Long userId;
    public String username;
    public Long departmentId;
    public DataScope currentScope;
    public Set<String> roles = Collections.emptySet();
    public Set<String> permissions = Collections.emptySet();
    public String rawToken;

    public void init(String tenantId, Long userId, String username, Long departmentId, DataScope scope) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.username = username;
        this.departmentId = departmentId;
        this.currentScope = scope;
    }

    public void init(String tenantId, Long userId, String username, Long departmentId, DataScope scope,
            Set<String> roles, Set<String> permissions, String rawToken) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.username = username;
        this.departmentId = departmentId;
        this.currentScope = scope;
        this.roles = roles != null ? roles : Collections.emptySet();
        this.permissions = permissions != null ? permissions : Collections.emptySet();
        this.rawToken = rawToken;
    }

    public boolean isAuthenticated() {
        return username != null && !username.isBlank();
    }
}
