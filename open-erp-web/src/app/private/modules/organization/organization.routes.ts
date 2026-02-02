import { Routes } from '@angular/router';
import { Organization } from './organization';
import { Detail } from './detail/detail';

export const routes: Routes = [
  {
    path: '',
    component: Organization,
    children: [
      {
        path: 'new',
        pathMatch: 'full',
        component: Detail,
      },
      {
        path: ':id',
        component: Detail,
      },
    ],
  },
];
