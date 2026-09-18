import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  NavController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  LanguageSwitcherComponent,
  ThemeSwitcherComponent,
  ButtonVariant,
  BadgeVariant,
  TenantInfo
} from '@shared';

@Component({
  selector: 'app-select-tenant',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent
  ],
  templateUrl: './select-tenant.page.html'
})
export class SelectTenantPage implements OnInit {
  private auth = inject(AuthService);
  private i18n = inject(I18nService);
  private navCtrl = inject(NavController);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly badgeVariantInfo = BadgeVariant.INFO;

  tenants = signal<TenantInfo[]>([]);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  private preAuthToken = '';

  ngOnInit() {
    const token = this.auth.getPreAuthToken();
    const tenants = this.auth.getPreAuthTenants();
    if (!token || !tenants.length) {
      this.navCtrl.navigateRoot('/login', { animationDirection: 'back' });
      return;
    }
    this.preAuthToken = token;
    this.tenants.set(tenants);
  }

  handleSelectTenant(tenantId: string) {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.selectTenant({ tenant_id: tenantId, pre_auth_token: this.preAuthToken }).subscribe({
      next: () => {
        this.loading.set(false);
        this.navCtrl.navigateRoot('/dashboard', { animationDirection: 'forward', replaceUrl: true });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  goBackToLogin() {
    this.navCtrl.navigateRoot('/login', { animationDirection: 'back' });
  }
}
