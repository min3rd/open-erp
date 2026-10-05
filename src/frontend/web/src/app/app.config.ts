import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { map } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { PLUGIN_PERMISSION_CHECKER, TENANT_THEME_API, ThemeId } from '@shared';
import { AuthService } from './core/services/auth.service';
import { UiPreferencesService } from './core/services/ui-preferences.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: PLUGIN_PERMISSION_CHECKER,
      useFactory: () => {
        const auth = inject(AuthService);
        return (permission?: string) =>
          !permission || (auth.isAuthenticated() && auth.hasPermission(permission) !== false);
      }
    },
    {
      provide: TENANT_THEME_API,
      useFactory: () => {
        const prefs = inject(UiPreferencesService);
        const auth = inject(AuthService);
        return {
          fetchTheme: () => prefs.getUiPreferences().pipe(map((res) => res.data?.theme ?? null)),
          updateTheme: (theme: ThemeId) => prefs.updateUiPreferences(theme),
          canManage: () => auth.isAuthenticated() && auth.hasPermission('core:tenant:settings-manage') !== false
        };
      }
    }
  ]
};
