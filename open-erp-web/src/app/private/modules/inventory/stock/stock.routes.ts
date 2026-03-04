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
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '-/1/100',
          },
          {
            path: ':search/:page/:limit',
            loadComponent: () => import('./list/list').then((m) => m.StockList),
          },
        ],
      },
      {
        path: 'lots',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '-/1/100',
          },
          {
            path: ':search/:page/:limit',
            loadComponent: () => import('./lots/lots').then((m) => m.Lots),
          },
        ],
      },
      {
        path: 'serials',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '-/1/100',
          },
          {
            path: ':search/:page/:limit',
            loadComponent: () => import('./serials/serials').then((m) => m.Serials),
          },
        ],
      },
    ],
  },
];
