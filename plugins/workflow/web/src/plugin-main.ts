import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL, authHeaderInterceptor } from '@shared';
import { WorkflowScreenComponent } from './app/workflow-screen.component';
import { WorkflowMenuItemComponent } from './app/workflow-menu-item.component';

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
      { provide: API_BASE_URL, useValue: '' },
    ],
  });
  customElements.define(
    'op-workflow-app',
    createCustomElement(WorkflowScreenComponent, { injector: app.injector }),
  );
  customElements.define(
    'op-workflow-menu-item',
    createCustomElement(WorkflowMenuItemComponent, { injector: app.injector }),
  );
}

void bootstrap();
