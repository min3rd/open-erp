import { Routes } from '@angular/router';
import { AdministrativeUnit } from './administrative-unit';
import { AdministrativeUnitList } from './list/list';
import { adminUnitTreeResolver } from './resolvers/admin-unit-tree.resolver';
import { ProvinceForm } from '../province/form/form';
import { DistrictForm } from '../district/form/form';
import { WardForm } from '../ward/form/form';
import { provinceDetailResolver } from '../province/resolvers/province-detail.resolver';
import { districtDetailResolver } from '../district/resolvers/district-detail.resolver';
import { wardDetailResolver } from '../ward/resolvers/ward-detail.resolver';

export const routes: Routes = [
  {
    path: '',
    component: AdministrativeUnit,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all/1/100',
      },
      {
        path: ':filter',
        children: [
          {
            path: ':page',
            children: [
              {
                path: ':limit',
                component: AdministrativeUnitList,
                resolve: {
                  treeData: adminUnitTreeResolver,
                },
                children: [
                  // Province routes
                  {
                    path: 'province/new',
                    component: ProvinceForm,
                  },
                  {
                    path: 'province/:code',
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
                  // District routes
                  {
                    path: 'district/new',
                    component: DistrictForm,
                  },
                  {
                    path: 'district/:code',
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
        ],
      },
    ],
  },
];
