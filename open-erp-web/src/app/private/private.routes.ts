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
    path: '',
    pathMatch: 'full',
    redirectTo: 'demo',
  },
];
