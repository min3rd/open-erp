import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { AuthService, ConfigService } from '@open-erp/shared';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export function initializeApp(configService: ConfigService) {
  return () => configService.loadConfig();
}

/** BUG-1.9 fix: Restore permissions after page reload if accessToken is still in localStorage */
export function restoreSession(authService: AuthService) {
  return () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return Promise.resolve();

    authService.accessToken.set(token);
    return authService
      .fetchProfileAndPermissions()
      .pipe(
        catchError(() =>
          // Token may be expired — try refreshing via HTTP-Only cookie
          authService.refreshToken().pipe(catchError(() => of(null)))
        )
      )
      .toPromise();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['vi', 'en', 'zh', 'ja'],
        defaultLang: 'vi',
        reRenderOnLangChange: true,
        prodMode: false,
      },
      loader: TranslocoHttpLoader,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: restoreSession,
      deps: [AuthService],
      multi: true,
    },
  ]
};
