import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  NavController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  BadgeVariant
} from '@shared';

interface DashboardFeature {
  code: string;
  titleKey: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent
  ],
  templateUrl: './dashboard.page.html'
})
export class DashboardPage {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  navCtrl = inject(NavController);

  readonly badgeSuccess = BadgeVariant.SUCCESS;
  readonly badgeInfo = BadgeVariant.INFO;

  readonly features: DashboardFeature[] = [
    { code: 'FEAT-01', titleKey: 'AUTH_REGISTER_PERSONAL_TAB' },
    { code: 'FEAT-02', titleKey: 'AUTH_REGISTER_BUSINESS_TAB' },
    { code: 'FEAT-03', titleKey: 'AUTH_LOGIN_TITLE' },
    { code: 'FEAT-04', titleKey: 'AUTH_FORGOT_PASS_TITLE' },
    { code: 'FEAT-05', titleKey: 'AUTH_2FA_TITLE' },
    { code: 'FEAT-06', titleKey: 'ACCOUNT_DRAWER_TITLE' }
  ];

  openAccount() {
    this.navCtrl.navigateForward(['/account']);
  }
}
