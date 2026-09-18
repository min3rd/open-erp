import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorVariant, SizeVariant } from '../../enums';
import { BadgeComponent } from '../badge/badge.component';
import { SharpButtonComponent } from '../sharp-button/sharp-button.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    SharpButtonComponent,
    LanguageSwitcherComponent,
    TranslatePipe
  ],
  templateUrl: './topbar.component.html'
})
export class TopbarComponent {
  tenantName = input<string>('');
  role = input<string>('MEMBER');
  userName = input<string>('');
  userEmail = input<string>('');

  openAccount = output<void>();
  logout = output<void>();

  readonly colorInfo = ColorVariant.INFO;
  readonly colorGhost = ColorVariant.GHOST;
  readonly sizeSm = SizeVariant.SM;

  userInitial = computed(() => {
    const name = this.userName() || this.userEmail() || 'U';
    return name.charAt(0).toUpperCase();
  });
}
