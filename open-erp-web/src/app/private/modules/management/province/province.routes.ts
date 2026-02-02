import { Routes } from '@angular/router';
import { Province } from './province';
import { ProvinceList } from './list/list';
import { ProvinceForm } from './form/form';
import { provinceDetailResolver } from './resolvers/province-detail.resolver';
import { provinceListResolver } from './resolvers/province-list.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Province,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all/1/10',
      },
      {
        path: ':filter',
        children: [
          {
            path: ':page',
            children: [
              {
                path: ':limit',
                component: ProvinceList,
                resolve: {
                  provinceList: provinceListResolver,
                },
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    component: ProvinceForm,
                  },
                  {
                    path: ':id',
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
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
