import { Routes } from '@angular/router';
import { Organization } from './organization';
import { Detail } from './detail/detail';
import { GeneralResolver } from './resolvers/general.resolver';
import { MembersResolver } from './resolvers/members.resolver';
import { InvitesResolver } from './resolvers/invites.resolver';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'detail',
  },
  {
    path: '',
    component: Organization,
    children: [
      {
        path: 'new',
        pathMatch: 'full',
        component: Detail,
      },
      {
        path: 'detail',
        component: Detail,
        children: [
          { path: '', redirectTo: 'general', pathMatch: 'full' },
          {
            path: 'general',
            loadComponent: () => import('./detail/tabs/general/general').then((m) => m.General),
            resolve: { general: GeneralResolver },
          },
          {
            path: 'members',
            loadComponent: () => import('./detail/tabs/members/members').then((m) => m.Members),
            resolve: { members: MembersResolver },
          },
          {
            path: 'invites',
            loadComponent: () => import('./detail/tabs/invites/invites').then((m) => m.Invites),
            resolve: { invites: InvitesResolver },
          },
          {
            path: 'relations',
            loadComponent: () =>
              import('./detail/tabs/relations/relations').then((m) => m.Relations),
          },
          {
            path: 'activity',
            loadComponent: () =>
              import('./detail/tabs/activity/activity').then((m) => m.Activity),
          },
        ],
      },
    ],
  },
];
