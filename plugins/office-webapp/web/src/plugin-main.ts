import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { API_BASE_URL } from '@shared';
import { OfficeWebappComponent } from './app/office-webapp.component';

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(),
      { provide: API_BASE_URL, useValue: '' },
    ],
  });
  customElements.define(
    'op-office-webapp-app',
    createCustomElement(OfficeWebappComponent, { injector: app.injector }),
  );
}

void bootstrap();
