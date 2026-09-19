import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  NavController
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/auth.service';
import { AccountService } from '../../../core/account.service';
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
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    SharpButtonComponent,
    SharpInputComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    TranslatePipe
  ],
  templateUrl: './change-password.page.html'
})
export class PlatformChangePasswordPage {
  private auth = inject(AuthService);
  private account = inject(AccountService);
  private i18n = inject(I18nService);
  private navCtrl = inject(NavController);

  readonly currentPassword = signal<string>('');
  readonly newPassword = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  submit() {
    this.error.set(null);
    this.success.set(null);

    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.error.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set(this.i18n.t('AUTH_PASSWORD_MISMATCH'));
      return;
    }
    if (this.newPassword().length < 8) {
      this.error.set(this.i18n.t('VALIDATION_PASSWORD_TOO_WEAK'));
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
        next: () => {
          this.saving.set(false);
          this.auth.markPasswordChanged();
          this.success.set(this.i18n.t('PASSWORD_CHANGE_SUCCESS'));
          setTimeout(
            () => this.navCtrl.navigateRoot('/platform/emergency', { animationDirection: 'forward', replaceUrl: true }),
            600
          );
        },
        error: (err) => {
          this.saving.set(false);
          const apiError = err as ApiErrorResponse;
          this.error.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
        }
      });
  }
}
