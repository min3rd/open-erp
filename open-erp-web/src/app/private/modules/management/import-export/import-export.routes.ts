import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '-/1/20',
  },
  {
    path: ':search/:page/:limit',
    loadComponent: () => import('./list/list').then((m) => m.ImportExportList),
  },
];
