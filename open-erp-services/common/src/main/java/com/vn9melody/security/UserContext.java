package com.vn9melody.security;

import com.vn9melody.enums.DataScope;
import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class UserContext {
    public String tenantId;
    public Long userId;
    public String username;
    public Long departmentId;
    public DataScope currentScope;

    public void init(String tenantId, Long userId, String username, Long departmentId, DataScope scope) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.username = username;
        this.departmentId = departmentId;
        this.currentScope = scope;
    }
}
