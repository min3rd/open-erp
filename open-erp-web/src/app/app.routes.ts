import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';

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
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
