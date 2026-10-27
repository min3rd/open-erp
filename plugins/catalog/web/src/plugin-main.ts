import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { CatalogPluginShellComponent } from './app/catalog-plugin-shell.component';
import { CatalogAdminComponent } from './app/features/catalog/catalog-admin.component';
import { CatalogScope } from './app/core/services/catalog-admin.service';
import { authHeaderInterceptor, PLUGIN_PERMISSION_CHECKER, API_BASE_URL } from '@shared';
import { pluginPermissionChecker } from './app/core/plugin-permission-checker';

const scope = new URLSearchParams(window.location.search).get('scope') === 'system'
  ? CatalogScope.SYSTEM
  : CatalogScope.TENANT;

bootstrapApplication(CatalogPluginShellComponent, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter([
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all/-/20/1/-/list',
      },
      {
        path: ':filter/:sort/:pageSize/:page/:id/:mode',
        component: CatalogAdminComponent,
        data: { catalogScope: scope },
      },
      {
        path: '**',
        component: CatalogAdminComponent,
        data: { catalogScope: scope },
      },
    ], withHashLocation()),
    provideHttpClient(withInterceptors([authHeaderInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: ''
    },
    {
      provide: PLUGIN_PERMISSION_CHECKER,
      useValue: pluginPermissionChecker,
    },
  ],
}).catch((err) => console.error(err));
