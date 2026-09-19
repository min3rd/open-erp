import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { decodeJwtPayload, readStringArrayClaim } from '../utils/jwt.util';

function readFunctionalPermissions(token: string | null): string[] | null {
  const payload = decodeJwtPayload(token);
  return (
    readStringArrayClaim(payload, 'functional_permissions') ??
    readStringArrayClaim(payload, 'permissions')
  );
}

export function permissionGuard(requiredPermission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const permissions = readFunctionalPermissions(auth.token());
    // TODO: Sprint 02 backend chưa phát hành claim `functional_permissions` trong access token.
    // Fallback cho phép điều hướng khi chưa có dữ liệu quyền để tránh khóa người dùng.
    if (permissions === null) {
      return true;
    }

    if (permissions.includes(requiredPermission) || permissions.includes('*')) {
      return true;
    }

    return router.createUrlTree(['/dashboard'], {
      queryParams: { denied: 'IAM_PERMISSION_DENIED_FUNCTIONAL', permission: requiredPermission }
    });
  };
}
