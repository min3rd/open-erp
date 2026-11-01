import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL, authHeaderInterceptor } from '@shared';
import { EmployeeScreenComponent } from './app/employee-screen.component';
import { EmployeeMenuItemComponent } from './app/employee-menu-item.component';

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
      { provide: API_BASE_URL, useValue: '' },
    ],
  });
  customElements.define(
    'op-employee-app',
    createCustomElement(EmployeeScreenComponent, { injector: app.injector }),
  );
  customElements.define(
    'op-employee-menu-item',
    createCustomElement(EmployeeMenuItemComponent, { injector: app.injector }),
  );
}

void bootstrap();
