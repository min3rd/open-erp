import { Routes } from '@angular/router';
import { Product } from './product';
import { ProductList } from './list/list';
import { ProductForm } from './form/form';
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
                                  {
                                    path: 'new',
                                    pathMatch: 'full',
                                    component: ProductForm,
                                  },
                                  // TODO: Add edit/view routes when needed
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
