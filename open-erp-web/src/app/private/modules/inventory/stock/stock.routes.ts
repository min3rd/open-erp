import { Routes } from '@angular/router';
import { Stock } from './stock';

export const routes: Routes = [
  {
    path: '',
    component: Stock,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'list',
        loadComponent: () => import('./list/list').then((m) => m.StockList),
      },
      {
        path: 'lots',
        loadComponent: () => import('./lots/lots').then((m) => m.Lots),
      },
      {
        path: 'serials',
        loadComponent: () => import('./serials/serials').then((m) => m.Serials),
      },
    ],
  },
];
