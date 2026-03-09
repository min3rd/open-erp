import { Routes } from '@angular/router';
import { Wms } from './wms';

export const routes: Routes = [
  {
    path: '',
    component: Wms,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'receipts',
      },
      {
        path: 'receipts',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '-/1/20',
          },
          {
            path: ':search/:page/:limit',
            loadComponent: () =>
              import('./receipts/list/list').then((m) => m.ReceiptList),
            children: [
              {
                path: 'new',
                loadComponent: () =>
                  import('./receipts/form/form').then((m) => m.ReceiptForm),
              },
              {
                path: ':id/view',
                loadComponent: () =>
                  import('./receipts/form/form').then((m) => m.ReceiptForm),
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('./receipts/form/form').then((m) => m.ReceiptForm),
              },
            ],
          },
        ],
      },
      {
        path: 'picklists',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '-/1/20',
          },
          {
            path: ':search/:page/:limit',
            loadComponent: () =>
              import('./picklists/list/list').then((m) => m.PicklistList),
          },
        ],
      },
      {
        path: 'shipments',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '-/1/20',
          },
          {
            path: ':search/:page/:limit',
            loadComponent: () =>
              import('./shipments/list/list').then((m) => m.ShipmentList),
          },
        ],
      },
    ],
  },
];
