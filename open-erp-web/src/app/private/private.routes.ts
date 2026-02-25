import { Routes } from '@angular/router';
import { Demo } from './demo/demo';
import { DemoFormEditor } from './demo/form-editor/demo-form-editor';

export const routes: Routes = [
  {
    path: 'modules',
    loadChildren: () => import('./modules/modules.routes').then((m) => m.routes),
  },
  {
    path: 'demo',
    component: Demo,
  },
  {
    path: 'demo/form-editor',
    component: DemoFormEditor,
  },
  {
    path: 'me',
    loadComponent: () => import('./me/me').then((m) => m.Me),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./me/profile/profile').then((m) => m.MeProfileComponent),
      },
      {
        path: 'security',
        loadComponent: () => import('./me/security/security').then((m) => m.MeSecurityComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./me/settings/settings').then((m) => m.MeSettingsComponent),
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'me',
  },
];
