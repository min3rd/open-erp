import { Routes } from '@angular/router';
import { AdminUnits } from './admin-units';
import { AdminUnitsList } from './list/list';
import { provincesResolver } from './resolvers/provinces.resolver';
import { ProvinceForm } from '../province/form/form';
import { WardForm } from '../ward/form/form';
import { provinceDetailResolver } from '../province/resolvers/province-detail.resolver';
import { wardDetailResolver } from '../ward/resolvers/ward-detail.resolver';

/**
 * Routes for admin units management (province + ward accordion view)
 */
export const routes: Routes = [
  {
    path: '',
    component: AdminUnits,
    children: [
      {
        path: '',
        component: AdminUnitsList,
        resolve: {
          provinces: provincesResolver,
        },
        children: [
          // Province routes
          {
            path: 'province/new',
            component: ProvinceForm,
          },
          {
            path: 'province/:id',
            resolve: {
              province: provinceDetailResolver,
            },
            children: [
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'view',
              },
              {
                path: 'view',
                component: ProvinceForm,
              },
              {
                path: 'edit',
                component: ProvinceForm,
              },
            ],
          },
          // Ward routes
          {
            path: 'ward/new',
            component: WardForm,
          },
          {
            path: 'ward/:code',
            resolve: {
              ward: wardDetailResolver,
            },
            children: [
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'view',
              },
              {
                path: 'view',
                component: WardForm,
              },
              {
                path: 'edit',
                component: WardForm,
              },
            ],
          },
        ],
      },
    ],
  },
];
