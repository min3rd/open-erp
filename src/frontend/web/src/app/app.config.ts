import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { PLUGIN_PERMISSION_CHECKER } from '@shared';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: PLUGIN_PERMISSION_CHECKER,
      useFactory: () => {
        const auth = inject(AuthService);
        return (permission?: string) => !permission || auth.hasPermission(permission) !== false;
      }
    }
  ]
};
