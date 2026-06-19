import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { APP_INITIALIZER } from '@angular/core';
import { catchError, of } from 'rxjs';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { TranslocoHttpLoader } from './app/transloco-loader';
import { AuthService, ConfigService } from '@open-erp/shared';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

export function initializeApp(configService: ConfigService) {
  return () => configService.loadConfig();
}

/** BUG-1.9 fix: Restore permissions after app restart/reload if accessToken is still in localStorage */
export function restoreSession(authService: AuthService) {
  return () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return Promise.resolve();

    authService.accessToken.set(token);
    return authService
      .fetchProfileAndPermissions()
      .pipe(
        catchError(() =>
          authService.refreshToken().pipe(catchError(() => of(null)))
        )
      )
      .toPromise();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
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
  ],
});
