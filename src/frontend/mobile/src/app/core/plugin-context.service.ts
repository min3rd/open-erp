import { Injectable, computed, inject } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { PluginContext } from '@shared';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { getJwtPermissions } from './jwt.util';

/**
 * Builds the context handed to plugin contributions on Mobile. Core owns this
 * shape; plugin components never read the Ionic stores directly.
 */
@Injectable({ providedIn: 'root' })
export class PluginContextService {
  private auth = inject(AuthService);
  private navCtrl = inject(NavController);

  readonly context = computed<PluginContext>(() => {
    const user = this.auth.user();
    return {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      language: document.documentElement.getAttribute('lang') || 'vi',
      direction: document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr',
      tenant: user ? { id: user.tenant_id, name: user.tenant_name } : null,
      user: user
        ? { id: user.user_id, name: user.full_name, email: user.email }
        : null,
      permissions: getJwtPermissions(localStorage.getItem('openerp_token')) ?? [],
      apiBaseUrl: environment.apiBaseUrl,
      navigate: (path: string) => this.navigate(path),
      notify: (payload) => {
        window.dispatchEvent(new CustomEvent('openerp:plugin-notify', { detail: payload }));
      },
    };
  });

  navigate(path: string): void {
    const target = path.startsWith('/') ? path : `/settings/${path}`;
    void this.navCtrl.navigateForward(target);
  }
}
