import { Route, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { platformRoleGuard, platformSuperAdminGuard } from './core/guards/platform-role.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { mustChangePasswordGuard } from './core/guards/must-change-password.guard';

/**
 * Path-segment list state: /:filter/:sort/:pageSize/:page/:id/:mode
 * Progressive URLs are supported; short URLs redirect to the canonical form.
 */
const listState = (loadComponent: Route['loadComponent']): Route[] => [
  { path: '', pathMatch: 'full', redirectTo: 'all/-/20/1/-/list' },
  {
    path: ':filter',
    children: [
      { path: '', pathMatch: 'full', redirectTo: '-/20/1/-/list' },
      {
        path: ':sort',
        children: [
          { path: '', pathMatch: 'full', redirectTo: '20/1/-/list' },
          {
            path: ':pageSize',
            children: [
              { path: '', pathMatch: 'full', redirectTo: '1/-/list' },
              {
                path: ':page',
                children: [
                  { path: '', pathMatch: 'full', redirectTo: '-/list' },
                  {
                    path: ':id',
                    children: [
                      { path: '', pathMatch: 'full', redirectTo: 'list' },
                      { path: ':mode', loadComponent },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

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
    path: 'apps/:pluginKey',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/apps/plugin-app.component').then(m => m.PluginAppComponent)
      },
      {
        path: '**',
        loadComponent: () => import('./features/apps/plugin-app.component').then(m => m.PluginAppComponent)
      }
    ]
  },
  {
    path: 'platform/change-password',
    canActivate: [authGuard, platformRoleGuard],
    loadComponent: () =>
      import('./features/platform/change-password/change-password.component').then(m => m.PlatformChangePasswordComponent)
  },
  {
    path: 'platform',
    canActivate: [authGuard, platformRoleGuard, mustChangePasswordGuard],
    loadComponent: () => import('./features/platform/platform-layout.component').then(m => m.PlatformLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tenants'
      },
      {
        path: 'tenants',
        children: listState(() => import('./features/platform/tenants/tenant-list.component').then(m => m.TenantListComponent))
      },
      {
        path: 'plugins',
        children: listState(() => import('./features/platform/plugins/platform-plugin-list.component').then(m => m.PlatformPluginListComponent))
      },
      {
        path: 'plugin-credentials',
        children: listState(() => import('./features/platform/plugins/platform-plugin-credentials.component').then(m => m.PlatformPluginCredentialsComponent))
      },
      {
        path: 'tenant-private-plugins',
        children: listState(() => import('./features/platform/plugins/platform-tenant-private-plugins.component').then(m => m.PlatformTenantPrivatePluginsComponent))
      },
      {
        path: 'users',
        children: listState(() => import('./features/platform/users/platform-user-list.component').then(m => m.PlatformUserListComponent))
      },
      {
        path: 'health',
        loadComponent: () => import('./features/platform/health/platform-health.component').then(m => m.PlatformHealthComponent)
      },
      {
        path: 'audit-logs',
        children: listState(() => import('./features/platform/audit-logs/audit-log-list.component').then(m => m.AuditLogListComponent))
      },
      {
        path: 'admins',
        canActivate: [platformSuperAdminGuard],
        children: listState(() => import('./features/platform/admins/platform-admin-list.component').then(m => m.PlatformAdminListComponent))
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
        children: listState(() => import('./features/settings/members/members.component').then(m => m.MembersComponent))
      },
      {
        path: 'memberships',
        pathMatch: 'full',
        redirectTo: 'members'
      },
      {
        path: 'branch-assignments',
        canActivate: [permissionGuard('core:organization:manage')],
        children: listState(() => import('./features/settings/branch-assignments/branch-assignment-list.component').then(m => m.BranchAssignmentListComponent))
      },
      {
        path: 'sample-records',
        canActivate: [permissionGuard('core:sample-record:read')],
        children: listState(() => import('./features/settings/sample-records/sample-record-list.component').then(m => m.SampleRecordListComponent))
      },
      {
        path: 'plugins',
        canActivate: [permissionGuard('core:plugin:read')],
        children: listState(() => import('./features/settings/plugins/plugin-marketplace.component').then(m => m.PluginMarketplaceComponent))
      },
      {
        path: 'plugin-credentials',
        canActivate: [permissionGuard('core:plugin:credential:manage')],
        children: listState(() => import('./features/settings/plugins/tenant-plugin-credentials.component').then(m => m.TenantPluginCredentialsComponent))
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
