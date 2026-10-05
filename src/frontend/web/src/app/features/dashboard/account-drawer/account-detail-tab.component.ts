import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  UserProfileData,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-account-detail-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent
  ],
  templateUrl: './account-detail-tab.component.html'
})
export class AccountDetailTabComponent implements OnInit {
  accountService = inject(AccountService);
  authService = inject(AuthService);
  i18n = inject(I18nService);

  profile = signal<UserProfileData | null>(null);

  profileFullName = '';
  profilePhone = '';
  profileAvatarUrl = '';
  profileLanguage = 'vi';
  profileTimezone = 'Asia/Ho_Chi_Minh';

  loadingProfileUpdate = signal<boolean>(false);
  profileSuccess = signal<string | null>(null);
  profileError = signal<string | null>(null);

  uploadingAvatar = signal<boolean>(false);
  avatarError = signal<string | null>(null);

  /** Absolute URL for the stored avatar (relative path → API base). */
  avatarPreview(): string {
    const url = this.profileAvatarUrl;
    if (!url) {
      return '';
    }
    return url.startsWith('http') ? url : `${environment.apiBaseUrl}${url}`;
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.avatarError.set(null);
    this.uploadingAvatar.set(true);
    this.accountService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.uploadingAvatar.set(false);
        this.profileAvatarUrl = res.data.avatar_url || '';
        this.profile.set(res.data);
        input.value = '';
      },
      error: (err) => {
        this.uploadingAvatar.set(false);
        this.avatarError.set(apiMessage(this.i18n, err));
        input.value = '';
      }
    });
  }

  ngOnInit() {
    this.loadProfile();
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
      },
      error: (err) => {
        this.profileError.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleUpdateProfile() {
    this.profileSuccess.set(null);
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
        this.authService.updateStoredUser({
          full_name: res.data.full_name,
          email: res.data.email
        });
        this.profileSuccess.set(this.i18n.t('ACCOUNT_PROFILE_UPDATE_SUCCESS'));
      },
      error: (err) => {
        this.loadingProfileUpdate.set(false);
        this.profileError.set(apiMessage(this.i18n, err));
      }
    });
  }
}
