import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { map } from 'rxjs';

import { routes } from './app.routes';
import { PLUGIN_PERMISSION_CHECKER, UI_PREFERENCES_API, loadingInterceptor, toUiPreferences } from '@shared';
import { AuthService } from './core/auth.service';
import { UiPreferencesService, UserUiPreferencesUpdate } from './core/ui-preferences.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor])),
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
        const auth = inject(AuthService);
        return {
          fetch: () => prefs.getUserUiPreferences().pipe(map((res) => toUiPreferences(res.data))),
          update: (preferences: UserUiPreferencesUpdate) => prefs.updateUserUiPreferences(preferences),
          updateTenantTheme: (theme: Parameters<UiPreferencesService['updateUiPreferences']>[0]) =>
            prefs.updateUiPreferences(theme),
          canManageTenant: () =>
            auth.isAuthenticated() && auth.hasPermission('core:tenant:settings-manage') !== false
        };
      }
    }
  ]
};
