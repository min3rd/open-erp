import { Routes } from '@angular/router';
import { Demo } from './demo/demo';
import { DemoFormEditor } from './demo/form-editor/demo-form-editor';
import { AcceptInvite } from './modules/organization/accept-invite/accept-invite';

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
    loadChildren: () => import('./me/me.routes').then((m) => m.meRoutes),
  },
  {
    path: 'invitations/accept',
    component: AcceptInvite,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'me',
  },
];
