import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'workflow-template',
  },
  {
    path: 'workflow-template',
    loadChildren: () =>
      import('./workflow-template/workflow-template.routes').then((m) => m.routes),
  },
];
