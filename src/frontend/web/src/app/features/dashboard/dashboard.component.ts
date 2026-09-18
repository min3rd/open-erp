import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AccountDrawerComponent } from './account-drawer/account-drawer.component';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  TopbarComponent,
  ButtonVariant,
  ButtonSize,
  BadgeVariant
} from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AccountDrawerComponent,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent,
    TopbarComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);

  readonly buttonVariantGhost = ButtonVariant.GHOST;
  readonly buttonSizeSm = ButtonSize.SM;
  readonly badgeVariantInfo = BadgeVariant.INFO;
  readonly badgeVariantSuccess = BadgeVariant.SUCCESS;

  isAccountDrawerOpen = signal<boolean>(false);

  setLang(lang: 'vi' | 'en') {
    this.i18n.setLanguage(lang);
  }
}
