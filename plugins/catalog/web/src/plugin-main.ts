import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { CatalogPluginShellComponent } from './app/catalog-plugin-shell.component';
import { CatalogAdminComponent } from './app/features/catalog/catalog-admin.component';
import { CatalogScope } from './app/core/services/catalog-admin.service';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { pluginPermissionChecker } from './app/core/plugin-permission-checker';
import { PLUGIN_PERMISSION_CHECKER } from '@shared';

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
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: PLUGIN_PERMISSION_CHECKER,
      useValue: pluginPermissionChecker,
    },
  ],
}).catch((err) => console.error(err));
