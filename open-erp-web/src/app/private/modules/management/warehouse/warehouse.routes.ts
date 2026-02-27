import { Routes } from '@angular/router';
import { Warehouse } from './warehouse';
import { WarehouseList } from './list/list';
import { WarehouseForm } from './form/form';
import { WarehouseStructureExplorer } from './structure/structure';
import { StructureDesigner } from './structure-designer/structure-designer';
import { warehouseDetailResolver } from './resolvers/warehouse-detail.resolver';
import { warehouseListResolver } from './resolvers/warehouse-list.resolver';
import { provincesResolver } from './resolvers/provinces.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Warehouse,
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
                    component: WarehouseList,
                    resolve: {
                      warehouseList: warehouseListResolver,
                    },
                    children: [
                      {
                        path: 'new',
                        pathMatch: 'full',
                        component: WarehouseForm,
                        resolve: {
                          provinces: provincesResolver,
                        },
                      },
                      {
                        path: ':id',
                        resolve: {
                          warehouse: warehouseDetailResolver,
                          provinces: provincesResolver,
                        },
                        children: [
                          {
                            path: '',
                            pathMatch: 'full',
                            redirectTo: 'view',
                          },
                          {
                            path: 'view',
                            component: WarehouseForm,
                          },
                          {
                            path: 'edit',
                            component: WarehouseForm,
                          },
                          {
                            path: 'structure',
                            component: WarehouseStructureExplorer,
                          },
                          {
                            path: 'designer',
                            component: StructureDesigner,
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
