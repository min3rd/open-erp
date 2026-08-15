package com.vn9melody.security;

import com.vn9melody.enums.DataScope;
import com.vn9melody.enums.PermissionCode;
import com.vn9melody.security.dto.UserSecurityProfile;
import io.quarkus.security.ForbiddenException;
import io.quarkus.security.UnauthorizedException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import jakarta.persistence.EntityManager;
import org.hibernate.Filter;
import org.hibernate.Session;

import java.lang.reflect.Method;
import java.util.Optional;

@RequirePermission(PermissionCode.ORDER_VIEW)
@Interceptor
@Priority(Interceptor.Priority.APPLICATION + 10)
public class RequirePermissionInterceptor {

    @Inject
    SecurityIdentity securityIdentity;

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
        UserSecurityProfile profile = permissionService.getUserSecurityProfile(username);
        if (profile == null) {
            throw new ForbiddenException("Không tìm thấy thông tin người dùng.");
        }

        Optional<DataScope> dataScopeOpt = permissionService.resolveDataScope(profile, requiredPermission);
        if (dataScopeOpt.isEmpty()) {
            throw new ForbiddenException("Bạn không có quyền: " + requiredPermission);
        }

        DataScope scope = dataScopeOpt.get();

        // 1. Lưu context
        userContext.init(
                profile.tenantId(),
                profile.userId(),
                profile.username(),
                profile.departmentId(),
                scope);

        // 2. Kích hoạt Hibernate Filter cho Session hiện tại
        enableDataSecurityFilter(profile.tenantId(), scope, profile.departmentId(), profile.username());

        return context.proceed();
    }

    private void enableDataSecurityFilter(String tenantId, DataScope scope, Long departmentId, String username) {
        Session session = entityManager.unwrap(Session.class);
        Filter filter = session.enableFilter("dataSecurityFilter");

        filter.setParameter("tenantId", tenantId);
        filter.setParameter("scope", scope.name());
        // Sử dụng giá trị mặc định an toàn nếu trường null để tránh lỗi SQL binding
        filter.setParameter("departmentId", departmentId != null ? departmentId : -1L);
        filter.setParameter("username", username != null ? username : "");
    }

    private PermissionCode extractPermissionCode(InvocationContext context) {
        Method method = context.getMethod();
        RequirePermission methodAnnotation = method.getAnnotation(RequirePermission.class);
        if (methodAnnotation != null)
            return methodAnnotation.value();

        RequirePermission classAnnotation = method.getDeclaringClass().getAnnotation(RequirePermission.class);
        if (classAnnotation != null)
            return classAnnotation.value();

        return null;
    }
}