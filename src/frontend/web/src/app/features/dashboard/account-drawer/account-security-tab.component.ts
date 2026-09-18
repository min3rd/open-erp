import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AccountService } from '../../../core/services/account.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  BadgeComponent,
  ButtonVariant,
  ButtonSize,
  ButtonType,
  BadgeVariant,
  TwoFactorStatus,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-account-security-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    BadgeComponent
  ],
  templateUrl: './account-security-tab.component.html'
})
export class AccountSecurityTabComponent implements OnInit {
  accountService = inject(AccountService);
  i18n = inject(I18nService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly buttonVariantDanger = ButtonVariant.DANGER;
  readonly buttonSizeSm = ButtonSize.SM;

  readonly badgeVariantSuccess = BadgeVariant.SUCCESS;
  readonly badgeVariantWarning = BadgeVariant.WARNING;

  twoFactorStatus = signal<TwoFactorStatus | null>(null);

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  logoutOtherDevices = false;
  loadingPasswordChange = signal<boolean>(false);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  securitySuccess = signal<string | null>(null);
  securityError = signal<string | null>(null);

  showRegenerateForm = signal<boolean>(false);
  regeneratePassword = '';
  loadingRegenerate = signal<boolean>(false);
  regenerateError = signal<string | null>(null);
  regeneratedCodes = signal<string[]>([]);
  copiedRegeneratedCodes = signal<boolean>(false);

  private previousUrl = this.router.url;

  ngOnInit() {
    this.refresh2FaStatus();

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      const url = event.urlAfterRedirects;
      if (url === '/account/security') {
        if (this.previousUrl.startsWith('/account/security/2fa/setup')) {
          this.securityError.set(null);
          this.securitySuccess.set(this.i18n.t('ACCOUNT_2FA_ENABLED_SUCCESS'));
          this.refresh2FaStatus();
        } else if (this.previousUrl.startsWith('/account/security/2fa/disable')) {
          this.securityError.set(null);
          this.securitySuccess.set(this.i18n.t('ACCOUNT_2FA_DISABLED_SUCCESS'));
          this.refresh2FaStatus();
        }
      }
      this.previousUrl = url;
    });
  }

  openSetup2Fa() {
    this.router.navigateByUrl('/account/security/2fa/setup');
  }

  openDisable2Fa() {
    this.router.navigateByUrl('/account/security/2fa/disable');
  }

  refresh2FaStatus() {
    this.accountService.get2FaStatus().subscribe({
      next: (res) => {
        this.twoFactorStatus.set(res.data);
      },
      error: (err) => {
        this.securityError.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleChangePassword() {
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set(this.i18n.t('AUTH_PASSWORD_MISMATCH'));
      return;
    }

    this.passwordSuccess.set(null);
    this.passwordError.set(null);
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

  openRegenerateForm() {
    this.regeneratePassword = '';
    this.regenerateError.set(null);
    this.showRegenerateForm.set(true);
  }

  cancelRegenerateForm() {
    this.showRegenerateForm.set(false);
    this.regeneratePassword = '';
    this.regenerateError.set(null);
  }

  submitRegenerateBackupCodes() {
    if (!this.regeneratePassword) {
      this.regenerateError.set(this.i18n.t('ACCOUNT_PASSWORD_REQUIRED'));
      return;
    }

    this.regenerateError.set(null);
    this.loadingRegenerate.set(true);

    this.accountService.regenerateBackupCodes(this.regeneratePassword).subscribe({
      next: (res) => {
        this.loadingRegenerate.set(false);
        this.showRegenerateForm.set(false);
        this.regeneratePassword = '';
        this.regeneratedCodes.set(res.data.backup_codes || []);
        this.securitySuccess.set(this.i18n.t('ACCOUNT_2FA_BACKUP_CODES_REGENERATED'));
        this.refresh2FaStatus();
      },
      error: (err) => {
        this.loadingRegenerate.set(false);
        this.regenerateError.set(apiMessage(this.i18n, err));
      }
    });
  }

  copyRegeneratedCodes() {
    const codes = this.regeneratedCodes();
    if (!codes.length) return;
    navigator.clipboard.writeText(codes.join('\n')).then(() => {
      this.copiedRegeneratedCodes.set(true);
      setTimeout(() => this.copiedRegeneratedCodes.set(false), 2000);
    });
  }

  dismissRegeneratedCodes() {
    this.regeneratedCodes.set([]);
    this.copiedRegeneratedCodes.set(false);
  }
}
