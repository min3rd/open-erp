import {
  provideTransloco,
  TranslocoModule,
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@jsverse/transloco';
import { isDevMode } from '@angular/core';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: {
      vi: {},
      en: {},
      es: {},
    },
    translocoConfig: {
      availableLangs: ['vi', 'en', 'es'],
      defaultLang: 'vi',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    },
    preloadLangs: true,
    ...options,
  });
}
