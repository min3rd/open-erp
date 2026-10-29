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
import { PLUGIN_PERMISSION_CHECKER, UI_PREFERENCES_API, ThemeId, loadingInterceptor, toUiPreferences, API_BASE_URL } from '@shared';
import { AuthService } from './core/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { UiPreferencesService, UserUiPreferencesUpdate } from './core/ui-preferences.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: environment.apiBaseUrl
    },
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
