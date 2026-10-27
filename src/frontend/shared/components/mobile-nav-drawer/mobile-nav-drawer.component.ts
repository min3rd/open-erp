import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ColorVariant, LayoutId } from '../../enums';
import { ThemeService } from '../../theme/theme.service';
import { BadgeComponent } from '../badge/badge.component';
import { DrawerComponent } from '../drawer/drawer.component';
import { IconComponent } from '../icon/icon.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';
import { SharpButtonComponent } from '../sharp-button/sharp-button.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-mobile-nav-drawer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BadgeComponent,
    DrawerComponent,
    IconComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './mobile-nav-drawer.component.html'
})
export class MobileNavDrawerComponent {
  private theme = inject(ThemeService);

  tenantName = input<string>('');
  role = input<string>('MEMBER');
  userName = input<string>('');
  userEmail = input<string>('');
  isOpen = input<boolean>(false);
  zIndex = input<number>(70);

  // Permission-gated tenant settings; each app computes these from its own auth
  // state and passes them in, so the shared drawer stays framework-agnostic.
  canManageRoles = input<boolean>(false);
  canManageOrganization = input<boolean>(false);
  canViewSampleRecords = input<boolean>(false);
  canViewPlugins = input<boolean>(false);
  canBrowseCatalog = input<boolean>(false);
  isPlatformAdmin = input<boolean>(false);

  close = output<void>();
  logout = output<void>();

  readonly colorInfo = ColorVariant.INFO;
  readonly colorDanger = ColorVariant.DANGER;

  /** Mobile has one drawer; honour the user's left/right menu preference. */
  readonly drawerSide = computed<'start' | 'end'>(() =>
    this.theme.navLayout() === LayoutId.SIDE ? 'start' : 'end'
  );

  readonly showTenantSettings = computed(
    () =>
      this.canManageRoles() ||
      this.canManageOrganization() ||
      this.canViewSampleRecords() ||
      this.canViewPlugins() ||
      this.canBrowseCatalog()
  );

  displayName = computed(() => this.userName() || this.userEmail());

  userInitial = computed(() => {
    const name = this.userName() || this.userEmail() || 'U';
    return name.charAt(0).toUpperCase();
  });

  onNavigate() {
    this.close.emit();
  }

  onLogout() {
    this.close.emit();
    this.logout.emit();
  }
}
