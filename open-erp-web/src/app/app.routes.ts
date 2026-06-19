import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { LayoutComponent } from './features/layout/layout.component';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'activate',
    loadComponent: () =>
      import('./features/auth/activate/activate.component').then(
        (m) => m.ActivateComponent
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then(
            (m) => m.HomeComponent
          ),
      },
      {
        path: 'org-structure',
        canActivate: [permissionGuard('ORG_READ')],
        loadComponent: () =>
          import('./features/org-structure/org-structure.component').then(
            (m) => m.OrgStructureComponent
          ),
      },
      {
        path: 'settings/roles',
        canActivate: [permissionGuard('ROLE_READ')],
        loadComponent: () =>
          import('./features/auth/role-builder/role-builder.component').then(
            (m) => m.RoleBuilderComponent
          ),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
