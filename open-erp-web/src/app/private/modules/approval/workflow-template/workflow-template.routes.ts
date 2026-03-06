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
        path: 'new',
        component: WorkflowTemplateForm,
      },
      {
        path: ':id/view',
        component: WorkflowTemplateForm,
        resolve: {
          workflowTemplate: workflowTemplateDetailResolver,
        },
      },
      {
        path: ':id/edit',
        component: WorkflowTemplateForm,
        resolve: {
          workflowTemplate: workflowTemplateDetailResolver,
        },
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
              },
            ],
          },
        ],
      },
    ],
  },
];
