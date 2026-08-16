import { Routes } from '@angular/router';
import { sharedAuthGuard } from '@open-erp/shared';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [sharedAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders.page').then(m => m.OrdersPage)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.page').then(m => m.UsersPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'tabs/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'tabs/dashboard'
  }
];
