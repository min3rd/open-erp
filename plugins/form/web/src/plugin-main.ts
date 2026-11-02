import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL, authHeaderInterceptor } from '@shared';
import { FormScreenComponent } from './app/form-screen.component';
import { FormFillComponent } from './app/form-fill.component';

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
      { provide: API_BASE_URL, useValue: '' },
    ],
  });
  customElements.define(
    'op-form-app',
    createCustomElement(FormScreenComponent, { injector: app.injector }),
  );
  customElements.define(
    'op-form-fill',
    createCustomElement(FormFillComponent, { injector: app.injector }),
  );
}

void bootstrap();
