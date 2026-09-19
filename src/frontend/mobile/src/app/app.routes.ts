import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { platformRoleGuard } from './core/guards/platform-role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email.page').then(m => m.VerifyEmailPage)
  },
  {
    path: 'auth/2fa',
    loadComponent: () => import('./pages/two-factor/two-factor.page').then(m => m.TwoFactorPage)
  },
  {
    path: 'select-tenant',
    loadComponent: () => import('./pages/select-tenant/select-tenant.page').then(m => m.SelectTenantPage)
  },
  {
    path: 'register/personal',
    loadComponent: () => import('./pages/register-personal/register-personal.page').then(m => m.RegisterPersonalPage)
  },
  {
    path: 'register/business',
    loadComponent: () => import('./pages/register-business/register-business.page').then(m => m.RegisterBusinessPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'account/2fa/setup',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/setup-2fa/setup-2fa.page').then(m => m.Setup2FaPage)
  },
  {
    path: 'account/2fa/disable',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/disable-2fa/disable-2fa.page').then(m => m.Disable2FaPage)
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage),
    children: [
      {
        path: '',
        redirectTo: 'detail',
        pathMatch: 'full'
      },
      {
        path: 'detail',
        loadComponent: () => import('./pages/account/account-detail/account-detail.component').then(m => m.AccountDetailComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./pages/account/account-security/account-security.component').then(m => m.AccountSecurityComponent)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./pages/account/account-sessions/account-sessions.component').then(m => m.AccountSessionsComponent)
      }
    ]
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'roles',
        pathMatch: 'full'
      },
      {
        path: 'roles',
        canActivate: [permissionGuard('core:role:manage')],
        loadComponent: () => import('./pages/settings/roles/roles.page').then(m => m.RolesPage)
      },
      {
        path: 'roles/:roleId',
        canActivate: [permissionGuard('core:role:manage')],
        loadComponent: () => import('./pages/settings/roles/role-detail/role-detail.page').then(m => m.RoleDetailPage)
      },
      {
        path: 'organization',
        canActivate: [permissionGuard('core:organization:manage')],
        loadComponent: () => import('./pages/settings/organization/organization.page').then(m => m.OrganizationPage)
      },
      {
        path: 'sample-records',
        canActivate: [permissionGuard('core:sample-record:read')],
        loadComponent: () => import('./pages/settings/sample-records/sample-records.page').then(m => m.SampleRecordsPage)
      }
    ]
  },
  {
    path: 'platform/emergency',
    canActivate: [authGuard, platformRoleGuard],
    loadComponent: () => import('./pages/platform/emergency/emergency.page').then(m => m.EmergencyPage)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
