import { Component, computed, effect, inject, signal } from '@angular/core';
import { IonApp, IonMenu, IonRouterOutlet, MenuController } from '@ionic/angular/standalone';
import { MobileNavDrawerComponent, PluginHostService, TenantSwitcherItem, ThemeService, TopProgressBarComponent } from '@shared';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonMenu, IonRouterOutlet, MobileNavDrawerComponent, TopProgressBarComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  auth = inject(AuthService);
  private theme = inject(ThemeService);
  private menuCtrl = inject(MenuController);
  private pluginHost = inject(PluginHostService);

  readonly menuOpen = signal(false);
  readonly pluginApps = computed(() =>
    this.pluginHost.screens()
      .filter((screen) => (screen.platforms ?? ['desktop']).includes('mobile'))
      .filter((screen) => !screen.permission || this.auth.hasPermission(screen.permission) !== false)
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
      .map((screen) => ({ route: screen.route, titleKey: screen.title_key }))
  );
  readonly tenants = computed<TenantSwitcherItem[]>(() =>
    this.auth.tenants().map((item) => ({
      id: item.tenant_id,
      name: item.tenant_name,
      slug: item.tenant_slug,
      role: item.role,
      is_default: item.is_default,
    }))
  );

  // Permission-gated drawer links. `hasPermission` returns null until the
  // Sprint 02 `permissions` claim is deployed, so we only hide on explicit false.
  // `isAuthenticated()` keeps them off the unauthenticated (login) shell.
  readonly canManageRoles = () =>
    this.auth.isAuthenticated() && this.auth.hasPermission('core:role:manage') !== false;
  readonly canManageOrganization = () =>
    this.auth.isAuthenticated() && this.auth.hasPermission('core:organization:manage') !== false;
  readonly canViewSampleRecords = () =>
    this.auth.isAuthenticated() && this.auth.hasPermission('core:sample-record:read') !== false;
  readonly canViewPlugins = () =>
    this.auth.isAuthenticated() && this.auth.hasPermission('core:plugin:read') !== false;
  readonly canBrowseCatalog = () =>
    this.auth.isAuthenticated() && this.auth.hasPermission('catalog:item:read') !== false;

  constructor() {
    this.theme.init();
    // Load plugin screens only after authentication; an unauthenticated manifest
    // request returns 401 and the interceptor clears the session.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        void this.pluginHost.loadManifest();
      }
    });
    // Apply the saved appearance (user prefs + tenant default) once per auth transition.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.theme.loadPreferences();
      }
    });
  }

  closeMenu() {
    this.menuOpen.set(false);
    this.menuCtrl.close();
  }

  async switchTenant(tenantId: string): Promise<void> {
    try {
      await firstValueFrom(this.auth.switchTenant(tenantId));
      // Full reload drops tenant-scoped caches and loaded plugin manifests.
      window.location.reload();
    } catch {
      // Keep the current session; the switcher stays available for a retry.
    }
  }
}
