import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/account.service';
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
  selector: 'app-account-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent
  ],
  templateUrl: './account-detail.component.html'
})
export class AccountDetailComponent implements OnInit {
  private accountService = inject(AccountService);
  private i18n = inject(I18nService);

  profile = signal<UserProfileData | null>(null);

  profileFullName = '';
  profilePhone = '';
  profileAvatarUrl = '';
  profileLanguage = 'vi';
  profileTimezone = 'Asia/Ho_Chi_Minh';
  loadingProfileUpdate = signal<boolean>(false);
  profileError = signal<string | null>(null);
  profileSuccess = signal<string | null>(null);

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.accountService.getProfile().subscribe({
      next: (res) => {
        const raw = res.data as UserProfileData & { user_id?: string };
        const profile: UserProfileData = {
          ...raw,
          id: raw.id || raw.user_id || ''
        };
        this.profile.set(profile);
        this.profileFullName = profile.full_name || '';
        this.profilePhone = profile.phone || '';
        this.profileAvatarUrl = profile.avatar_url || '';
        this.profileLanguage = profile.language || 'vi';
        this.profileTimezone = profile.timezone || 'Asia/Ho_Chi_Minh';
      },
      error: (err) => {
        this.profileError.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleUpdateProfile() {
    this.profileError.set(null);
    this.profileSuccess.set(null);
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
        const raw = res.data as UserProfileData & { user_id?: string };
        this.profile.set({ ...raw, id: raw.id || raw.user_id || '' });
        this.profileSuccess.set(this.i18n.t('ACCOUNT_PROFILE_UPDATE_SUCCESS'));
      },
      error: (err) => {
        this.loadingProfileUpdate.set(false);
        this.profileError.set(apiMessage(this.i18n, err));
      }
    });
  }
}
