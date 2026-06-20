import { Routes } from '@angular/router';
import { LayoutTabsPage } from './layout-tabs/layout-tabs.page';

export const routes: Routes = [
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'register/user',
    loadComponent: () => import('./auth/register-user/register-user.page').then((m) => m.RegisterUserPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: LayoutTabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'org-structure',
        loadComponent: () => import('./org-structure/org-structure.page').then((m) => m.OrgStructurePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
