import { Routes } from '@angular/router';
import { Product } from './product';
import { ProductList } from './list/list';
import { productListResolver } from './resolvers/product-list.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Product,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '-/all/all/all/[name,asc]/1/100',
      },
      {
        path: ':search',
        children: [
          {
            path: ':status',
            children: [
              {
                path: ':type',
                children: [
                  {
                    path: ':category',
                    children: [
                      {
                        path: ':sort',
                        children: [
                          {
                            path: ':page',
                            children: [
                              {
                                path: ':limit',
                                component: ProductList,
                                resolve: {
                                  productList: productListResolver,
                                },
                                children: [
                                  // TODO: Add form routes for create/edit/view when form component is implemented
                                  // {
                                  //   path: 'new',
                                  //   pathMatch: 'full',
                                  //   component: ProductForm,
                                  // },
                                  // {
                                  //   path: ':id',
                                  //   children: [
                                  //     {
                                  //       path: '',
                                  //       pathMatch: 'full',
                                  //       redirectTo: 'view',
                                  //     },
                                  //     {
                                  //       path: 'view',
                                  //       component: ProductForm,
                                  //     },
                                  //     {
                                  //       path: 'edit',
                                  //       component: ProductForm,
                                  //     },
                                  //   ],
                                  // },
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
        ],
      },
    ],
  },
];
