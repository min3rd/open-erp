import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { AppConfigService, sharedAuthInterceptor, SharedTranslocoHttpLoader } from '@open-erp/shared';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const configService = inject(AppConfigService);
      return configService.loadConfig();
    }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([sharedAuthInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['vi', 'en'],
        defaultLang: 'vi',
        reRenderOnLangChange: true,
        prodMode: !isDevMode()
      },
      loader: SharedTranslocoHttpLoader
    })
  ]
};
