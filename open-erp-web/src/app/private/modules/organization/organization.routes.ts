import { Routes } from '@angular/router';
import { Organization } from './organization';
import { Detail } from './detail/detail';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'detail',
  },
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
        path: 'detail',
        pathMatch: 'full',
        component: Detail,
      },
    ],
  },
];
