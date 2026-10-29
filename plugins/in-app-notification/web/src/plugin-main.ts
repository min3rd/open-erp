import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL, authHeaderInterceptor } from '@shared';
import { NotificationScreenComponent } from './app/notification-screen.component';
import { NotificationBellComponent } from './app/notification-bell.component';
import { NotificationSettingsComponent } from './app/notification-settings.component';

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
      {
        // Empty on the web host: the service builds the gateway path relative
        // to the current origin. Mobile passes its backend origin through the
        // `apiBaseUrl` property so the same bundle works cross-origin.
        provide: API_BASE_URL,
        useValue: '',
      },
    ],
  });
  customElements.define(
    'op-in-app-notification-app',
    createCustomElement(NotificationScreenComponent, { injector: app.injector }),
  );
  customElements.define(
    'op-in-app-notification-bell',
    createCustomElement(NotificationBellComponent, { injector: app.injector }),
  );
  customElements.define(
    'op-in-app-notification-settings',
    createCustomElement(NotificationSettingsComponent, { injector: app.injector }),
  );
}

void bootstrap();
