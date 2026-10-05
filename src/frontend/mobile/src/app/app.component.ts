import { Component, effect, inject, signal } from '@angular/core';
import { IonApp, IonMenu, IonRouterOutlet, MenuController } from '@ionic/angular/standalone';
import { MobileNavDrawerComponent, ThemeService, TopProgressBarComponent } from '@shared';
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

  readonly menuOpen = signal(false);

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

  constructor() {
    this.theme.init();
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
}
