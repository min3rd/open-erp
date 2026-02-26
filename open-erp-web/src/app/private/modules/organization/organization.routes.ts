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
          { path: 'general', resolve: { general: GeneralResolver } },
          { path: 'members', resolve: { members: MembersResolver } },
          { path: 'invites', resolve: { invites: InvitesResolver } },
          { path: 'relations' },
          { path: 'activity' },
        ],
      },
    ],
  },
];
