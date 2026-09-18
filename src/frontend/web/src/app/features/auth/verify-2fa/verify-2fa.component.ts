import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  PinInputComponent,
  LanguageSwitcherComponent,
  ButtonVariant,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-verify-2fa',
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
    LanguageSwitcherComponent
  ],
  templateUrl: './verify-2fa.component.html'
})
export class Verify2FaComponent implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  backupCodeInput = '';
  useBackupCode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  private preAuthToken = '';
  private returnUrl = '/dashboard';

  ngOnInit() {
    this.preAuthToken = this.auth.getPreAuthToken();
    if (!this.preAuthToken) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.route.queryParams.subscribe(params => {
      const url = params['returnUrl'];
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
        this.returnUrl = url;
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
          this.auth.storePreAuth(res.data.pre_auth_token || this.preAuthToken, res.data.tenants || []);
          this.router.navigateByUrl('/select-tenant');
        } else {
          this.auth.clearPreAuth();
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.code === 'AUTH_2FA_ATTEMPTS_EXCEEDED') {
          this.auth.clearPreAuth();
          this.router.navigateByUrl('/login');
          return;
        }
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }
}
