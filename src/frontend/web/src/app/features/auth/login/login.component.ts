import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  PinInputComponent,
  BadgeComponent,
  LanguageSwitcherComponent,
  ButtonVariant,
  ButtonType,
  BadgeVariant,
  TenantInfo
} from '@shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    PinInputComponent,
    BadgeComponent,
    LanguageSwitcherComponent
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly badgeVariantInfo = BadgeVariant.INFO;

  email = '';
  password = '';
  backupCodeInput = '';

  mode = signal<'CREDENTIALS' | '2FA_CHALLENGE' | 'SELECT_TENANT'>('CREDENTIALS');
  useBackupCode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  preAuthToken = '';
  availableTenants = signal<TenantInfo[]>([]);

  setLang(lang: 'vi' | 'en') {
    this.i18n.setLanguage(lang);
  }

  handleLogin() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data.requires_2fa) {
          this.preAuthToken = res.data.pre_auth_token || '';
          this.mode.set('2FA_CHALLENGE');
        } else if (res.data.requires_tenant_selection) {
          this.preAuthToken = res.data.pre_auth_token || '';
          this.availableTenants.set(res.data.tenants || []);
          this.mode.set('SELECT_TENANT');
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handle2FaComplete(code: string) {
    this.submit2Fa(code);
  }

  handleBackupCodeSubmit() {
    if (!this.backupCodeInput.trim()) return;
    this.submit2Fa(this.backupCodeInput.trim());
  }

  private submit2Fa(code: string) {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.verifyLogin2Fa({ code, pre_auth_token: this.preAuthToken }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data.requires_tenant_selection) {
          this.preAuthToken = res.data.pre_auth_token || '';
          this.availableTenants.set(res.data.tenants || []);
          this.mode.set('SELECT_TENANT');
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleSelectTenant(tenantId: string) {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.selectTenant({ tenant_id: tenantId, pre_auth_token: this.preAuthToken }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }
}
