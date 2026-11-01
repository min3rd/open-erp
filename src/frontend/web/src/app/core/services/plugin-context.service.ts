import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PluginContext } from '@shared';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Builds the context handed to plugin contributions. Core owns this shape; a
 * plugin must not read core stores directly.
 */
@Injectable({ providedIn: 'root' })
export class PluginContextService {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly context = computed<PluginContext>(() => {
    const user = this.auth.user();
    const permissions = this.auth.functionalPermissions() ?? [];
    return {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      language: document.documentElement.getAttribute('lang') || 'vi',
      direction: document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr',
      tenant: user ? { id: user.tenant_id, name: user.tenant_name } : null,
      user: user
        ? { id: user.user_id, name: user.full_name, email: user.email }
        : null,
      permissions,
      apiBaseUrl: environment.apiBaseUrl,
      tenants: this.auth.tenants(),
      switchTenant: async (tenantId: string) => {
        await firstValueFrom(this.auth.switchTenant(tenantId));
        // Full reload drops tenant-scoped caches/plugin sessions/manifests.
        window.location.reload();
      },
      navigate: (path: string) => this.navigate(path),
      notify: (payload) => {
        // Contributions report codes, not localized text. A core toast service
        // can consume this event later; S06 keeps the contract without UI noise.
        window.dispatchEvent(new CustomEvent('openerp:plugin-notify', { detail: payload }));
      },
    };
  });

  navigate(path: string): void {
    const target = path.startsWith('/') ? path : `/settings/${path}`;
    void this.router.navigateByUrl(target);
  }
}
