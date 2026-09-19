import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import {
  ApiErrorResponse,
  I18nService,
  LanguageSwitcherComponent,
  SharpButtonComponent,
  SharpInputComponent,
  ThemeSwitcherComponent,
  TranslatePipe
} from '@shared';

@Component({
  selector: 'app-platform-change-password',
  standalone: true,
  imports: [
    CommonModule,
    SharpButtonComponent,
    SharpInputComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    TranslatePipe
  ],
  templateUrl: './change-password.component.html'
})
export class PlatformChangePasswordComponent {
  private auth = inject(AuthService);
  private account = inject(AccountService);
  private i18n = inject(I18nService);
  private router = inject(Router);

  readonly currentPassword = signal<string>('');
  readonly newPassword = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  submit() {
    this.errorText.set('');
    this.successText.set('');

    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorText.set(this.i18n.t('AUTH_PASSWORD_MISMATCH'));
      return;
    }
    if (this.newPassword().length < 8) {
      this.errorText.set(this.i18n.t('VALIDATION_PASSWORD_TOO_WEAK'));
      return;
    }

    this.saving.set(true);
    this.account
      .changePassword({
        current_password: this.currentPassword(),
        new_password: this.newPassword(),
        logout_other_devices: false
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.auth.markPasswordChanged();
          this.successText.set(this.i18n.t(res.code || 'PASSWORD_CHANGE_SUCCESS', res.params));
          setTimeout(() => this.router.navigateByUrl('/platform/tenants'), 600);
        },
        error: (err) => {
          this.saving.set(false);
          const apiError = err as ApiErrorResponse;
          this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
        }
      });
  }

  logout() {
    this.auth.logout();
  }
}
