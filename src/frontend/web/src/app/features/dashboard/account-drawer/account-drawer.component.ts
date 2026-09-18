import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { Setup2FaDrawerComponent } from './setup-2fa-drawer.component';
import { Disable2FaDrawerComponent } from './disable-2fa-drawer.component';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  DrawerComponent,
  SharpButtonComponent,
  SharpInputComponent,
  BadgeComponent,
  ButtonVariant,
  ButtonSize,
  ButtonType,
  BadgeVariant,
  AccountTab,
  UserProfileData, 
  TwoFactorStatus, 
  UserSessionData
} from '@shared';

@Component({
  selector: 'app-account-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateDirective,
    TranslatePipe,
    DrawerComponent,
    SharpButtonComponent,
    SharpInputComponent,
    BadgeComponent,
    Setup2FaDrawerComponent,
    Disable2FaDrawerComponent
  ],
  templateUrl: './account-drawer.component.html'
})
export class AccountDrawerComponent implements OnInit {
  accountService = inject(AccountService);
  authService = inject(AuthService);
  i18n = inject(I18nService);

  readonly accountTabProfile = AccountTab.PROFILE;
  readonly accountTabSecurity = AccountTab.SECURITY;
  readonly accountTabSessions = AccountTab.SESSIONS;

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly buttonVariantDanger = ButtonVariant.DANGER;
  readonly buttonSizeSm = ButtonSize.SM;

  readonly badgeVariantSuccess = BadgeVariant.SUCCESS;
  readonly badgeVariantWarning = BadgeVariant.WARNING;
  readonly badgeVariantInfo = BadgeVariant.INFO;

  isOpen = input<boolean>(false);
  close = output<void>();

  activeTab = signal<AccountTab>(AccountTab.PROFILE);

  profile = signal<UserProfileData | null>(null);
  twoFactorStatus = signal<TwoFactorStatus | null>(null);
  sessions = signal<UserSessionData[]>([]);

  // Profile form
  profileFullName = '';
  profilePhone = '';
  profileAvatarUrl = '';
  profileLanguage = 'vi';
  profileTimezone = 'Asia/Ho_Chi_Minh';
  loadingProfileUpdate = signal<boolean>(false);
  profileError = signal<string | null>(null);

  // Change password form
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  logoutOtherDevices = false;
  loadingPasswordChange = signal<boolean>(false);
  passwordError = signal<string | null>(null);

  // Stacked drawers state
  openSetup2FaDrawer = signal<boolean>(false);
  openDisable2FaDrawer = signal<boolean>(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadProfile();
    this.refresh2FaStatus();
    this.loadSessions();
  }

  loadProfile() {
    this.accountService.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.profileFullName = res.data.full_name;
        this.profilePhone = res.data.phone || '';
        this.profileAvatarUrl = res.data.avatar_url || '';
        this.profileLanguage = res.data.language || 'vi';
        this.profileTimezone = res.data.timezone || 'Asia/Ho_Chi_Minh';
      }
    });
  }

  refresh2FaStatus() {
    this.accountService.get2FaStatus().subscribe({
      next: (res) => {
        this.twoFactorStatus.set(res.data);
      }
    });
  }

  loadSessions() {
    this.accountService.getSessions().subscribe({
      next: (res) => {
        this.sessions.set(res.data || []);
      }
    });
  }

  handleUpdateProfile() {
    this.profileError.set(null);
    this.loadingProfileUpdate.set(true);

    this.accountService.updateProfile({
      full_name: this.profileFullName,
      phone: this.profilePhone,
      avatar_url: this.profileAvatarUrl,
      language: this.profileLanguage,
      timezone: this.profileTimezone
    }).subscribe({
      next: (res) => {
        this.loadingProfileUpdate.set(false);
        this.profile.set(res.data);
        alert(this.i18n.t('ACCOUNT_PROFILE_UPDATE_SUCCESS'));
      },
      error: (err) => {
        this.loadingProfileUpdate.set(false);
        this.profileError.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleChangePassword() {
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set(this.i18n.t('AUTH_PASSWORD_MISMATCH'));
      return;
    }

    this.passwordError.set(null);
    this.loadingPasswordChange.set(true);

    this.accountService.changePassword({
      current_password: this.currentPassword,
      new_password: this.newPassword,
      logout_other_devices: this.logoutOtherDevices
    }).subscribe({
      next: () => {
        this.loadingPasswordChange.set(false);
        alert(this.i18n.t('ACCOUNT_PASSWORD_CHANGE_SUCCESS'));
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.loadSessions();
      },
      error: (err) => {
        this.loadingPasswordChange.set(false);
        this.passwordError.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleRegenerateBackupCodes() {
    const pwd = prompt(this.i18n.t('ACCOUNT_CURRENT_PASSWORD_LABEL'));
    if (!pwd) return;

    this.accountService.regenerateBackupCodes(pwd).subscribe({
      next: (res) => {
        alert(this.i18n.t('ACCOUNT_2FA_BACKUP_CODES_REGENERATED') + '\n\n' + res.data.join('\n'));
        this.refresh2FaStatus();
      },
      error: (err) => {
        alert(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleRevokeSession(sessionId: string) {
    if (!confirm(this.i18n.t('ACCOUNT_SESSION_REVOKED_SUCCESS'))) return;

    this.accountService.revokeSession(sessionId).subscribe({
      next: () => {
        this.loadSessions();
      },
      error: (err) => {
        alert(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleRevokeOtherSessions() {
    if (!confirm(this.i18n.t('ACCOUNT_REVOKE_OTHERS_BUTTON'))) return;

    this.accountService.revokeOtherSessions().subscribe({
      next: () => {
        alert(this.i18n.t('ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS'));
        this.loadSessions();
      },
      error: (err) => {
        alert(this.i18n.t(err.code, err.params));
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
