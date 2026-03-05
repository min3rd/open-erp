import { Routes } from '@angular/router';
import { WorkflowTemplateComponent } from './workflow-template';
import { WorkflowTemplateList } from './list/list';
import { WorkflowTemplateForm } from './form/form';
import { workflowTemplateListResolver } from '../../../../../core/services/workflow-template/workflow-template-list.resolver';
import { workflowTemplateDetailResolver } from './resolvers/workflow-template-detail.resolver';

export const routes: Routes = [
  {
    path: '',
    component: WorkflowTemplateComponent,
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
                component: WorkflowTemplateList,
                resolve: {
                  workflowTemplateList: workflowTemplateListResolver,
                },
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    component: WorkflowTemplateForm,
                  },
                  {
                    path: ':id',
                    resolve: {
                      workflowTemplate: workflowTemplateDetailResolver,
                    },
                    children: [
                      {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'view',
                      },
                      {
                        path: 'view',
                        component: WorkflowTemplateForm,
                      },
                      {
                        path: 'edit',
                        component: WorkflowTemplateForm,
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
