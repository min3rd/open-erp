import { Routes } from '@angular/router';
import { User } from './user';
import { List } from './list/list';
import { Detail } from './detail/detail';
import { General } from './general/general';
import { EditorForm } from './editor-form/editor-form';
import { RolesAssignment } from './roles-assignment/roles-assignment';
import { ResetPassword } from './reset-password/reset-password';
import { AuditLogs } from './audit-logs/audit-logs';
import { userDetailResolver } from './resolvers/user-detail.resolver';
import { userMembershipsResolver } from './resolvers/user-memberships.resolver';
import { userActivityLogsResolver } from './resolvers/user-activity-logs.resolver';
import { userRolesPermissionsResolver } from './resolvers/user-roles-permissions.resolver';

export const routes: Routes = [
  {
    path: '',
    component: User,
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
                component: List,
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    component: EditorForm,
                  },
                  {
                    path: ':id',
                    component: Detail,
                    resolve: { userDetail: userDetailResolver },
                    children: [
                      {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'general',
                      },
                      {
                        path: 'general',
                        component: General,
                      },
                      {
                        path: 'roles-assignment',
                        component: RolesAssignment,
                        resolve: { 
                          rolesPermissionsData: userRolesPermissionsResolver
                        },
                      },
                      {
                        path: 'reset-password',
                        component: ResetPassword,
                      },
                      {
                        path: 'audit-logs',
                        component: AuditLogs,
                        resolve: { activityLogs: userActivityLogsResolver },
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
