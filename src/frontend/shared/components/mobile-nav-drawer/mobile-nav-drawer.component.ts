import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ColorVariant } from '../../enums';
import { BadgeComponent } from '../badge/badge.component';
import { DrawerComponent } from '../drawer/drawer.component';
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
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './mobile-nav-drawer.component.html'
})
export class MobileNavDrawerComponent {
  tenantName = input<string>('');
  role = input<string>('MEMBER');
  userName = input<string>('');
  userEmail = input<string>('');
  isOpen = input<boolean>(false);

  close = output<void>();
  logout = output<void>();

  readonly colorInfo = ColorVariant.INFO;
  readonly colorDanger = ColorVariant.DANGER;

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
