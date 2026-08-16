import { Routes } from '@angular/router';
import { sharedAuthGuard } from '@open-erp/shared';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'design-system',
    loadComponent: () => import('@open-erp/shared').then(m => m.ComponentShowcaseComponent)
  },
  {
    path: 'components',
    redirectTo: 'design-system'
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [sharedAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
