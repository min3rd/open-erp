package com.vn9melody.security;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.eclipse.microprofile.jwt.JsonWebToken;
import org.hibernate.Filter;
import org.hibernate.Session;

import com.vn9melody.enums.DataScope;
import com.vn9melody.enums.PermissionCode;
import com.vn9melody.security.dto.UserSecurityProfile;
import com.vn9melody.security.jwt.JwtClaimsConstant;

import io.quarkus.security.ForbiddenException;
import io.quarkus.security.UnauthorizedException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.Priority;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import jakarta.persistence.EntityManager;

@RequirePermission
@Interceptor
@Priority(Interceptor.Priority.APPLICATION + 10)
public class RequirePermissionInterceptor {

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    Instance<JsonWebToken> jwtInstance;

    @Inject
    PermissionService permissionService;

    @Inject
    UserContext userContext;

    @Inject
    EntityManager entityManager;

    @AroundInvoke
    public Object intercept(InvocationContext context) throws Exception {
        if (securityIdentity.isAnonymous() || securityIdentity.getPrincipal() == null) {
            throw new UnauthorizedException("Yêu cầu xác thực trước khi truy cập.");
        }

        PermissionCode requiredPermission = extractPermissionCode(context);
        if (requiredPermission == null) {
            return context.proceed();
        }

        String username = securityIdentity.getPrincipal().getName();

        // 1. Lấy thông tin UserSecurityProfile (L1/L2 Redis hoặc DB)
        UserSecurityProfile profile = permissionService.getUserSecurityProfile(username);
        if (profile == null) {
            throw new ForbiddenException("Không tìm thấy thông tin quyền của người dùng: " + username);
        }

        // 2. Xác định DataScope cho permission được yêu cầu
        Optional<DataScope> dataScopeOpt = permissionService.resolveDataScope(profile, requiredPermission);
        if (dataScopeOpt.isEmpty()) {
            throw new ForbiddenException("Bạn không có quyền: " + requiredPermission);
        }

        DataScope scope = dataScopeOpt.get();

        // 3. Đọc raw token và roles từ JWT nếu có
        String rawToken = null;
        Set<String> roles = Collections.emptySet();
        if (jwtInstance.isResolvable()) {
            JsonWebToken jwt = jwtInstance.get();
            rawToken = jwt.getRawToken();
            if (jwt.getGroups() != null) {
                roles = jwt.getGroups();
            }
        }

        Set<String> permissionNames = new HashSet<>();
        if (profile.permissions() != null) {
            profile.permissions().forEach(p -> permissionNames.add(p.code().name()));
        }

        // 4. Khởi tạo UserContext cho request hiện tại
        userContext.init(
                profile.tenantId(),
                profile.userId(),
                profile.username(),
                profile.departmentId(),
                scope,
                roles,
                permissionNames,
                rawToken);

        // 5. Kích hoạt Hibernate Filter 'dataSecurityFilter' cho session hiện tại
        enableDataSecurityFilter(profile.tenantId(), scope, profile.departmentId(), profile.username());

        return context.proceed();
    }

    private void enableDataSecurityFilter(String tenantId, DataScope scope, Long departmentId, String username) {
        Session session = entityManager.unwrap(Session.class);
        Filter filter = session.enableFilter("dataSecurityFilter");

        filter.setParameter("tenantId", tenantId != null ? tenantId : "");
        filter.setParameter("scope", scope.name());
        filter.setParameter("departmentId", departmentId != null ? departmentId : -1L);
        filter.setParameter("username", username != null ? username : "");
    }

    private PermissionCode extractPermissionCode(InvocationContext context) {
        Method method = context.getMethod();
        RequirePermission methodAnnotation = method.getAnnotation(RequirePermission.class);
        if (methodAnnotation != null) {
            return methodAnnotation.value();
        }

        RequirePermission classAnnotation = method.getDeclaringClass().getAnnotation(RequirePermission.class);
        if (classAnnotation != null) {
            return classAnnotation.value();
        }

        return null;
    }
}