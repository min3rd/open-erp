import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';
import { VerifyAccount } from './verify-account/verify-account';
import { TwoFa } from './two-fa/two-fa';
import { TwoFaRecovery } from './two-fa-recovery/two-fa-recovery';
import { Auth } from './auth';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '',
    component: Auth,
    children: [
      {
        path: 'login',
        component: Login,
      },
      {
        path: 'register',
        component: Register,
      },
      {
        path: 'forgot-password',
        component: ForgotPassword,
      },
      {
        path: 'reset-password',
        component: ResetPassword,
      },
      {
        path: 'verify-account',
        component: VerifyAccount,
      },
      {
        path: '2fa',
        component: TwoFa,
      },
      {
        path: '2fa/recovery-disable',
        component: TwoFaRecovery,
      },
    ],
  },
];
