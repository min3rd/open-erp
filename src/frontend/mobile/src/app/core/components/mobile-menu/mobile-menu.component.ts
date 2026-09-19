import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  personOutline,
  shieldCheckmarkOutline,
  desktopOutline,
  keyOutline,
  businessOutline,
  documentTextOutline,
  warningOutline
} from 'ionicons/icons';
import { AuthService } from '../../auth.service';
import {
  BadgeComponent,
  ColorVariant,
  LanguageSwitcherComponent,
  SharpButtonComponent,
  ThemeSwitcherComponent,
  TranslateDirective,
  TranslatePipe
} from '@shared';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    BadgeComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    SharpButtonComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './mobile-menu.component.html'
})
export class MobileMenuComponent {
  private menuCtrl = inject(MenuController);
  private auth = inject(AuthService);

  tenantName = input<string>('');
  role = input<string>('');
  userName = input<string>('');
  userEmail = input<string>('');

  readonly colorInfo = ColorVariant.INFO;
  readonly colorDanger = ColorVariant.DANGER;

  displayName = computed(() => this.userName() || this.userEmail());
  userInitial = computed(() => (this.userName() || this.userEmail() || 'U').charAt(0).toUpperCase());

  /**
   * TODO(TASK-281/BUG-67): read from the shared tenant security context once it
   * lands. Until the Sprint 02 `permissions` JWT claim is deployed,
   * `hasPermission()` returns `null` → fallback show the menu entry.
   */
  canManageRoles = computed(() => this.auth.hasPermission('core:role:manage') !== false);
  canManageOrganization = computed(() => this.auth.hasPermission('core:organization:manage') !== false);
  canViewSampleRecords = computed(() => this.auth.hasPermission('core:sample-record:read') !== false);
  showTenantSettings = computed(() =>
    this.auth.isAuthenticated() &&
    (this.canManageRoles() || this.canManageOrganization() || this.canViewSampleRecords())
  );
  isPlatformAdmin = computed(() => this.auth.isPlatformAdmin());

  constructor() {
    addIcons({
      homeOutline,
      personOutline,
      shieldCheckmarkOutline,
      desktopOutline,
      keyOutline,
      businessOutline,
      documentTextOutline,
      warningOutline
    });
  }

  close(): void {
    this.menuCtrl.close();
  }

  onLogout(): void {
    this.close();
    this.auth.logout();
  }
}
