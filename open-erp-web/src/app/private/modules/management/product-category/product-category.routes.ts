import { Routes } from '@angular/router';
import { ProductCategory } from './product-category';
import { ProductCategoryList } from './list/list';
import { ProductCategoryForm } from './form/form';
import { productCategoryDetailResolver } from './resolvers/product-category-detail.resolver';
import { productCategoryListResolver } from './resolvers/product-category-list.resolver';
import { parentCategoriesResolver } from './resolvers/parent-categories.resolver';

export const routes: Routes = [
  {
    path: '',
    component: ProductCategory,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '-/1/100',
      },
      {
        path: ':search',
        children: [
          {
            path: ':page',
            children: [
              {
                path: ':limit',
                component: ProductCategoryList,
                resolve: {
                  productCategoryList: productCategoryListResolver,
                },
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    component: ProductCategoryForm,
                    resolve: {
                      parentCategories: parentCategoriesResolver,
                    },
                  },
                  {
                    path: ':id',
                    resolve: {
                      productCategory: productCategoryDetailResolver,
                      parentCategories: parentCategoriesResolver,
                    },
                    children: [
                      {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'view',
                      },
                      {
                        path: 'view',
                        component: ProductCategoryForm,
                      },
                      {
                        path: 'edit',
                        component: ProductCategoryForm,
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
