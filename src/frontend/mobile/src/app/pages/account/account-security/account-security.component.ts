import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular/standalone';
import { AccountService } from '../../../core/account.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  BadgeComponent,
  ButtonVariant,
  BadgeVariant,
  TwoFactorStatus,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-account-security',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    BadgeComponent
  ],
  templateUrl: './account-security.component.html'
})
export class AccountSecurityComponent implements OnInit {
  private accountService = inject(AccountService);
  private i18n = inject(I18nService);
  private navCtrl = inject(NavController);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly buttonVariantDanger = ButtonVariant.DANGER;
  readonly badgeVariantSuccess = BadgeVariant.SUCCESS;
  readonly badgeVariantWarning = BadgeVariant.WARNING;

  twoFactorStatus = signal<TwoFactorStatus | null>(null);

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  logoutOtherDevices = false;
  loadingPasswordChange = signal<boolean>(false);
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);

  regeneratePassword = '';
  showRegenerateForm = signal<boolean>(false);
  loadingRegenerate = signal<boolean>(false);
  regenerateError = signal<string | null>(null);
  regeneratedCodes = signal<string[]>([]);

  ngOnInit() {
    this.refresh2FaStatus();
  }

  refresh2FaStatus() {
    this.accountService.get2FaStatus().subscribe({
      next: (res) => {
        this.twoFactorStatus.set(res.data);
      }
    });
  }

  handleChangePassword() {
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set(this.i18n.t('AUTH_PASSWORD_MISMATCH'));
      return;
    }

    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.loadingPasswordChange.set(true);

    this.accountService.changePassword({
      current_password: this.currentPassword,
      new_password: this.newPassword,
      logout_other_devices: this.logoutOtherDevices
    }).subscribe({
      next: () => {
        this.loadingPasswordChange.set(false);
        this.passwordSuccess.set(this.i18n.t('ACCOUNT_PASSWORD_CHANGE_SUCCESS'));
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
      },
      error: (err) => {
        this.loadingPasswordChange.set(false);
        this.passwordError.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleRegenerateBackupCodes() {
    this.regenerateError.set(null);
    this.loadingRegenerate.set(true);

    this.accountService.regenerateBackupCodes(this.regeneratePassword).subscribe({
      next: (res) => {
        this.loadingRegenerate.set(false);
        this.regeneratedCodes.set(res.data.backup_codes || []);
        this.regeneratePassword = '';
        this.refresh2FaStatus();
      },
      error: (err) => {
        this.loadingRegenerate.set(false);
        this.regenerateError.set(apiMessage(this.i18n, err));
      }
    });
  }

  openSetup2Fa() {
    this.navCtrl.navigateForward(['/account/2fa/setup']);
  }

  openDisable2Fa() {
    this.navCtrl.navigateForward(['/account/2fa/disable']);
  }
}
