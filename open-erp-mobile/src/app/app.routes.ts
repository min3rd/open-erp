import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'org-structure',
    loadComponent: () => import('./org-structure/org-structure.page').then((m) => m.OrgStructurePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

];
