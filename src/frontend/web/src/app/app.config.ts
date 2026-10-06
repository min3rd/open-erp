import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { map } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { PLUGIN_PERMISSION_CHECKER, UI_PREFERENCES_API, ThemeId, loadingInterceptor, toUiPreferences } from '@shared';
import { AuthService } from './core/services/auth.service';
import { UiPreferencesService, UserUiPreferencesUpdate } from './core/services/ui-preferences.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor])),
    {
      provide: PLUGIN_PERMISSION_CHECKER,
      useFactory: () => {
        const auth = inject(AuthService);
        return (permission?: string) =>
          !permission || (auth.isAuthenticated() && auth.hasPermission(permission) !== false);
      }
    },
    {
      provide: UI_PREFERENCES_API,
      useFactory: () => {
        const prefs = inject(UiPreferencesService);
        return {
          fetch: () => prefs.getUserUiPreferences().pipe(map((res) => toUiPreferences(res.data))),
          update: (preferences: UserUiPreferencesUpdate) => prefs.updateUserUiPreferences(preferences),
          updateTenantTheme: (theme: ThemeId) => prefs.updateUiPreferences(theme)
        };
      }
    }
  ]
};
