import { Routes } from '@angular/router';
import { Modules } from './modules';

export const routes: Routes = [
  {
    path: '',
    component: Modules,
    children: [
      {
        path: 'organization',
        loadChildren: () => import('./organization/organization.routes').then((m) => m.routes),
      },
      {
        path: 'management',
        loadChildren: () => import('./management/management.routes').then((m) => m.routes),
      },
    ],
  },
];
