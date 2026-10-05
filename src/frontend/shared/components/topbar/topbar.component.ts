import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorVariant } from '../../enums';
import { BadgeComponent } from '../badge/badge.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { MobileNavDrawerComponent } from '../mobile-nav-drawer/mobile-nav-drawer.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    UserMenuComponent,
    MobileNavDrawerComponent,
    TranslatePipe
  ],
  templateUrl: './topbar.component.html'
})
export class TopbarComponent {
  tenantName = input<string>('');
  role = input<string>('MEMBER');
  userName = input<string>('');
  userEmail = input<string>('');
  settingsPath = input<string | null>(null);
  platformPath = input<string | null>(null);

  openAccount = output<void>();
  logout = output<void>();

  readonly colorInfo = ColorVariant.INFO;

  readonly mobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu() {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }
}
