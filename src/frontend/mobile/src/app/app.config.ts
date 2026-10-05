import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { map } from 'rxjs';

import { routes } from './app.routes';
import { PLUGIN_PERMISSION_CHECKER, TENANT_THEME_API, ThemeId } from '@shared';
import { AuthService } from './core/auth.service';
import { UiPreferencesService } from './core/ui-preferences.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),
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
