import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { platformRoleGuard } from './core/guards/platform-role.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register/personal',
    loadComponent: () => import('./features/auth/register-personal/register-personal.component').then(m => m.RegisterPersonalComponent)
  },
  {
    path: 'register/business',
    loadComponent: () => import('./features/auth/register-business/register-business.component').then(m => m.RegisterBusinessComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'select-tenant',
    loadComponent: () => import('./features/auth/select-tenant/select-tenant.component').then(m => m.SelectTenantComponent)
  },
  {
    path: 'auth/2fa',
    loadComponent: () => import('./features/auth/verify-2fa/verify-2fa.component').then(m => m.Verify2FaComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'detail'
      },
      {
        path: 'detail',
        loadComponent: () => import('./features/dashboard/account-drawer/account-detail-tab.component').then(m => m.AccountDetailTabComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./features/dashboard/account-drawer/account-security-tab.component').then(m => m.AccountSecurityTabComponent),
        children: [
          {
            path: '2fa/setup',
            loadComponent: () => import('./features/dashboard/account-drawer/setup-2fa-drawer.component').then(m => m.Setup2FaDrawerComponent)
          },
          {
            path: '2fa/disable',
            loadComponent: () => import('./features/dashboard/account-drawer/disable-2fa-drawer.component').then(m => m.Disable2FaDrawerComponent)
          }
        ]
      },
      {
        path: 'sessions',
        loadComponent: () => import('./features/dashboard/account-drawer/account-sessions-tab.component').then(m => m.AccountSessionsTabComponent)
      }
    ]
  },
  {
    path: 'platform',
    canActivate: [authGuard, platformRoleGuard],
    loadComponent: () => import('./features/platform/platform-layout.component').then(m => m.PlatformLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tenants'
      },
      {
        path: 'tenants',
        loadComponent: () => import('./features/platform/tenants/tenant-list.component').then(m => m.TenantListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/platform/users/platform-user-list.component').then(m => m.PlatformUserListComponent)
      },
      {
        path: 'health',
        loadComponent: () => import('./features/platform/health/platform-health.component').then(m => m.PlatformHealthComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/platform/audit-logs/audit-log-list.component').then(m => m.AuditLogListComponent)
      },
      {
        path: 'admins',
        loadComponent: () => import('./features/platform/admins/platform-admin-list.component').then(m => m.PlatformAdminListComponent)
      }
    ]
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings-layout.component').then(m => m.SettingsLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'roles'
      },
      {
        path: 'roles',
        canActivate: [permissionGuard('core:role:manage')],
        loadComponent: () => import('./features/settings/roles/role-matrix.component').then(m => m.RoleMatrixComponent)
      },
      {
        path: 'organization',
        canActivate: [permissionGuard('core:organization:manage')],
        loadComponent: () => import('./features/settings/organization/organization.component').then(m => m.OrganizationComponent)
      },
      {
        path: 'members',
        canActivate: [permissionGuard('core:organization:manage')],
        loadComponent: () => import('./features/settings/members/members.component').then(m => m.MembersComponent)
      },
      {
        path: 'memberships',
        pathMatch: 'full',
        redirectTo: 'members'
      },
      {
        path: 'branch-assignments',
        canActivate: [permissionGuard('core:organization:manage')],
        loadComponent: () => import('./features/settings/branch-assignments/branch-assignment-list.component').then(m => m.BranchAssignmentListComponent)
      },
      {
        path: 'sample-records',
        canActivate: [permissionGuard('core:sample-record:read')],
        loadComponent: () => import('./features/settings/sample-records/sample-record-list.component').then(m => m.SampleRecordListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
