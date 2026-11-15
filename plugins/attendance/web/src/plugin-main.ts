import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, I18nService, LangCode, authHeaderInterceptor } from '@shared';
import { AttendanceScreenComponent } from './app/attendance-screen.component';
import { AttendanceMenuItemComponent } from './app/attendance-menu-item.component';

async function preloadDictionaries(app: Awaited<ReturnType<typeof createApplication>>): Promise<void> {
  const http = app.injector.get(HttpClient);
  const i18n = app.injector.get(I18nService);
  for (const lang of [LangCode.VI, LangCode.EN]) {
    // Core host serves /i18n; the anonymous public kiosk page loads the
    // plugin's own dictionary through the runtime gateway instead.
    const urls = [
      `/i18n/${lang}.json?_t=${Date.now()}`,
      `/api/v1/plugins/runtime/attendance/i18n/${lang}.json?_t=${Date.now()}`,
    ];
    for (const url of urls) {
      try {
        const dictionary = await firstValueFrom(http.get<Record<string, string>>(url));
        if (dictionary) {
          i18n.setDictionary(lang, dictionary);
          break;
        }
      } catch {
        // Try the next source; I18nService still retries lazily.
      }
    }
  }
}

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
      { provide: API_BASE_URL, useValue: '' },
    ],
  });
  await preloadDictionaries(app);
  customElements.define(
    'op-attendance-app',
    createCustomElement(AttendanceScreenComponent, { injector: app.injector }),
  );
  customElements.define(
    'op-attendance-menu-item',
    createCustomElement(AttendanceMenuItemComponent, { injector: app.injector }),
  );
}

void bootstrap();

