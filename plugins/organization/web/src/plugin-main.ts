import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL, authHeaderInterceptor } from '@shared';
import { OrgScreenComponent } from './app/org-screen.component';

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
      { provide: API_BASE_URL, useValue: '' },
    ],
  });
  customElements.define(
    'op-org-structure-app',
    createCustomElement(OrgScreenComponent, { injector: app.injector }),
  );
}

void bootstrap();
