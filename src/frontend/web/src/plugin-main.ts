import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { map } from 'rxjs';

import { CatalogPluginShellComponent } from './app/features/apps/catalog-plugin-shell.component';
import { CatalogAdminComponent } from './app/features/settings/catalog/catalog-admin.component';
import { CatalogScope } from './app/core/services/catalog-admin.service';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { AuthService } from './app/core/services/auth.service';
import { UiPreferencesService, UserUiPreferencesUpdate } from './app/core/services/ui-preferences.service';
import {
  PLUGIN_PERMISSION_CHECKER,
  UI_PREFERENCES_API,
  ThemeId,
  loadingInterceptor,
  toUiPreferences,
} from '@shared';

const scope = new URLSearchParams(window.location.search).get('scope') === 'system'
  ? CatalogScope.SYSTEM
  : CatalogScope.TENANT;

bootstrapApplication(CatalogPluginShellComponent, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter([
      {
        path: '',
        component: CatalogAdminComponent,
        data: { catalogScope: scope },
      },
      {
        path: '**',
        component: CatalogAdminComponent,
        data: { catalogScope: scope },
      },
    ], withHashLocation()),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor])),
    {
      provide: PLUGIN_PERMISSION_CHECKER,
      useFactory: () => {
        const auth = inject(AuthService);
        return (permission?: string) =>
          !permission || (auth.isAuthenticated() && auth.hasPermission(permission) !== false);
      },
    },
    {
      provide: UI_PREFERENCES_API,
      useFactory: () => {
        const prefs = inject(UiPreferencesService);
        return {
          fetch: () => prefs.getUserUiPreferences().pipe(map((res) => toUiPreferences(res.data))),
          update: (preferences: UserUiPreferencesUpdate) => prefs.updateUserUiPreferences(preferences),
          updateTenantTheme: (theme: ThemeId) => prefs.updateUiPreferences(theme),
        };
      },
    },
  ],
}).catch((err) => console.error(err));
