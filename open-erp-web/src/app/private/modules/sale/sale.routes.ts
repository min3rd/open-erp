import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pos',
    loadChildren: () => import('./pos/pos.routes').then((m) => m.routes),
  },
];
