import { ApplicationConfig, provideAppInitializer, inject, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { AppConfigService, sharedAuthInterceptor, SharedTranslocoHttpLoader, provideSharedIcons } from '@open-erp/shared';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({ mode: 'ios' }),
    provideSharedIcons(),
    provideAppInitializer(() => {
      const configService = inject(AppConfigService);
      return configService.loadConfig();
    }),
    provideRouter(routes, withComponentInputBinding()),
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
