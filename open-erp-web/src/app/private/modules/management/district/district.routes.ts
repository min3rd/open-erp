import { Routes } from '@angular/router';
import { District } from './district';
import { DistrictList } from './list/list';
import { DistrictForm } from './form/form';
import { districtDetailResolver } from './resolvers/district-detail.resolver';
import { districtListResolver } from './resolvers/district-list.resolver';
import { provinceListResolver } from '../province/resolvers/province-list.resolver';

export const routes: Routes = [
  {
    path: '',
    component: District,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all-provinces/all/1/100',
      },
      {
        path: ':provinceFilter',
        children: [
          {
            path: ':filter',
            children: [
              {
                path: ':page',
                children: [
                  {
                    path: ':limit',
                    component: DistrictList,
                    resolve: {
                      districtList: districtListResolver,
                      provinceList: provinceListResolver,
                    },
                    children: [
                      {
                        path: 'new',
                        pathMatch: 'full',
                        component: DistrictForm,
                      },
                      {
                        path: ':code',
                        resolve: {
                          district: districtDetailResolver,
                        },
                        children: [
                          {
                            path: '',
                            pathMatch: 'full',
                            redirectTo: 'view',
                          },
                          {
                            path: 'view',
                            component: DistrictForm,
                          },
                          {
                            path: 'edit',
                            component: DistrictForm,
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
    ],
  },
];
