import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MemoryPlatformLocation } from './app/core/memory-platform-location';

import { CatalogPluginShellComponent } from './app/catalog-plugin-shell.component';
import { CatalogAdminComponent } from './app/features/catalog/catalog-admin.component';
import { CatalogScope } from './app/core/services/catalog-admin.service';
import { authHeaderInterceptor, PLUGIN_PERMISSION_CHECKER, API_BASE_URL } from '@shared';
import { pluginPermissionChecker } from './app/core/plugin-permission-checker';

async function bootstrap(): Promise<void> {
  const app = await createApplication({
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
          data: { catalogScope: CatalogScope.TENANT },
        },
        {
          path: '**',
          component: CatalogAdminComponent,
          data: { catalogScope: CatalogScope.TENANT },
        },
      ]),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
      { provide: PlatformLocation, useClass: MemoryPlatformLocation },
      {
        provide: API_BASE_URL,
        useValue: '',
      },
      {
        provide: PLUGIN_PERMISSION_CHECKER,
        useValue: pluginPermissionChecker,
      },
    ],
  });
  customElements.define(
    'op-catalog-app',
    createCustomElement(CatalogPluginShellComponent, { injector: app.injector }),
  );
}

void bootstrap();
