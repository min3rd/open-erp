import { Routes } from '@angular/router';
import { ProductType } from './product-type';
import { ProductTypeList } from './list/list';
import { ProductTypeForm } from './form/form';
import { productTypeDetailResolver } from './resolvers/product-type-detail.resolver';
import { productTypeListResolver } from './resolvers/product-type-list.resolver';

export const routes: Routes = [
  {
    path: '',
    component: ProductType,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all/-/1/100',
      },
      {
        path: ':scope',
        children: [
          {
            path: ':search',
            children: [
              {
                path: ':page',
                children: [
                  {
                    path: ':limit',
                    component: ProductTypeList,
                    resolve: {
                      productTypeList: productTypeListResolver,
                    },
                    children: [
                      {
                        path: 'new',
                        pathMatch: 'full',
                        component: ProductTypeForm,
                      },
                      {
                        path: ':id',
                        resolve: {
                          productType: productTypeDetailResolver,
                        },
                        children: [
                          {
                            path: '',
                            pathMatch: 'full',
                            redirectTo: 'view',
                          },
                          {
                            path: 'view',
                            component: ProductTypeForm,
                          },
                          {
                            path: 'edit',
                            component: ProductTypeForm,
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
