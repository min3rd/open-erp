import { Routes } from '@angular/router';

export const meRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./me').then((m) => m.Me),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./profile/profile').then((m) => m.MeProfileComponent),
      },
      {
        path: 'security',
        loadComponent: () => import('./security/security').then((m) => m.MeSecurityComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then((m) => m.MeSettingsComponent),
      },
    ],
  },
];
