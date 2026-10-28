import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { CatalogPluginShellComponent } from './app/catalog-plugin-shell.component';
import { CatalogAdminComponent } from './app/features/catalog/catalog-admin.component';
import { CatalogScope } from './app/core/services/catalog-admin.service';
import { CATALOG_READ_ONLY } from './app/core/catalog-read-only';
import { authHeaderInterceptor, PLUGIN_PERMISSION_CHECKER, API_BASE_URL } from '@shared';
import { pluginPermissionChecker } from './app/core/plugin-permission-checker';

/**
 * The core gateway rejects the iframe cookie once the short-lived runtime token
 * expires. Tell the host so it can mint a new token and reload the frame; the
 * plugin itself has no way to refresh it.
 */
let sessionExpiryReported = false;

const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (
        !sessionExpiryReported &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        (error.error as { code?: string } | null)?.code === 'PLUGIN_RUNTIME_TOKEN_INVALID'
      ) {
        sessionExpiryReported = true;
        window.parent?.postMessage({ source: 'open-erp-plugin', type: 'session-expired' }, '*');
      }
      return throwError(() => error);
    })
  );

const scope = new URLSearchParams(window.location.search).get('scope') === 'system'
  ? CatalogScope.SYSTEM
  : CatalogScope.TENANT;
const readOnly = new URLSearchParams(window.location.search).get('readonly') === '1';
if (readOnly) {
  document.body.classList.add('catalog-readonly');
}

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
    provideHttpClient(withInterceptors([authHeaderInterceptor, sessionExpiredInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: ''
    },
    {
      provide: CATALOG_READ_ONLY,
      useValue: readOnly
    },
    {
      provide: PLUGIN_PERMISSION_CHECKER,
      useValue: pluginPermissionChecker,
    },
  ],
}).catch((err) => console.error(err));
