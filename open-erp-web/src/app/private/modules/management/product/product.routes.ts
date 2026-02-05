import { Routes } from '@angular/router';
import { Product } from './product';
import { ProductList } from './list/list';
import { ProductForm } from './form/form';
import { ProductDetail } from './detail/detail';
import { productListResolver } from './resolvers/product-list.resolver';
import { productDetailResolver } from './resolvers/product-detail.resolver';

// Tab components
import { ProductTabGeneral } from './detail/tabs/general.tab';
import { ProductTabMedia } from './detail/tabs/media.tab';
import { ProductTabWeight } from './detail/tabs/weight.tab';
import { ProductTabDimensions } from './detail/tabs/dimensions.tab';
import { ProductTabStorage } from './detail/tabs/storage.tab';
import { ProductTabWarehouse } from './detail/tabs/warehouse.tab';
import { ProductTabCustom } from './detail/tabs/custom.tab';

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
                                  // Product detail routes (using SKU as identifier)
                                  {
                                    path: ':sku',
                                    resolve: {
                                      product: productDetailResolver,
                                    },
                                    children: [
                                      {
                                        path: '',
                                        pathMatch: 'full',
                                        redirectTo: 'view',
                                      },
                                      {
                                        path: 'view',
                                        component: ProductDetail,
                                        children: [
                                          {
                                            path: '',
                                            pathMatch: 'full',
                                            redirectTo: 'general',
                                          },
                                          {
                                            path: 'general',
                                            component: ProductTabGeneral,
                                          },
                                          {
                                            path: 'media',
                                            component: ProductTabMedia,
                                          },
                                          {
                                            path: 'weight',
                                            component: ProductTabWeight,
                                          },
                                          {
                                            path: 'dimensions',
                                            component: ProductTabDimensions,
                                          },
                                          {
                                            path: 'storage',
                                            component: ProductTabStorage,
                                          },
                                          {
                                            path: 'warehouse',
                                            component: ProductTabWarehouse,
                                          },
                                          {
                                            path: 'custom',
                                            component: ProductTabCustom,
                                          },
                                        ],
                                      },
                                      {
                                        path: 'edit',
                                        component: ProductForm,
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
        ],
      },
    ],
  },
];
