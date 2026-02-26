import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  provideEnvironmentInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { httpInterceptor } from '../core/interceptors/http-interceptor';
import { authInterceptor } from '../core/interceptors/auth-interceptor';
import { AuthService } from '../core/services/auth-service';
import { ThemeService } from '../core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        },
      },
      ripple: true,
    }),
    provideHttpClient(withInterceptors([httpInterceptor, authInterceptor])),
    provideEnvironmentInitializer(() => inject(AuthService)),
    provideEnvironmentInitializer(() => inject(ThemeService)),
    provideTransloco({
      config: {
        availableLangs: ['vi', 'en', 'es'],
        defaultLang: 'vi',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
