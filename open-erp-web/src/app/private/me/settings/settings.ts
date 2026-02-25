import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

import { MeService, MeSettings } from '../../../../core/services/me-service';

@Component({
  selector: 'me-settings',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    SkeletonModule,
    ToggleSwitchModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeSettingsComponent implements OnInit, OnDestroy {
  private meService = inject(MeService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);

  settingsForm!: FormGroup;

  readonly dateFormats = [
    { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  ];

  readonly themes = [
    { label: 'Tự động (theo hệ thống)', value: 'auto' },
    { label: 'Sáng', value: 'light' },
    { label: 'Tối', value: 'dark' },
  ];

  readonly languages = [
    { label: 'Tiếng Việt', value: 'vi' },
    { label: 'English', value: 'en' },
  ];

  readonly densities = [
    { label: 'Thoải mái', value: 'comfortable' },
    { label: 'Compact', value: 'compact' },
  ];

  readonly timezones = [
    { label: 'Asia/Ho_Chi_Minh (GMT+7)', value: 'Asia/Ho_Chi_Minh' },
    { label: 'Asia/Bangkok (GMT+7)', value: 'Asia/Bangkok' },
    { label: 'UTC', value: 'UTC' },
    { label: 'America/New_York (EST)', value: 'America/New_York' },
    { label: 'Europe/London (GMT)', value: 'Europe/London' },
    { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  ];

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      dateFormat: ['DD/MM/YYYY'],
      timezone: ['Asia/Ho_Chi_Minh'],
      theme: ['auto'],
      language: ['vi'],
      layoutDensity: ['comfortable'],
      notificationsInApp: [true],
      notificationsEmail: [true],
      notificationsPush: [false],
    });

    this.meService
      .getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.settingsForm.patchValue({
            dateFormat: settings.dateFormat || 'DD/MM/YYYY',
            timezone: settings.timezone || 'Asia/Ho_Chi_Minh',
            theme: settings.theme || 'auto',
            language: settings.language || 'vi',
            layoutDensity: settings.layoutDensity || 'comfortable',
            notificationsInApp: settings.notificationsInApp !== false,
            notificationsEmail: settings.notificationsEmail !== false,
            notificationsPush: settings.notificationsPush === true,
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  saveSettings(): void {
    if (this.isSaving()) return;
    this.isSaving.set(true);

    const values = this.settingsForm.value as Partial<MeSettings>;

    this.meService
      .updateSettings(values)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cài đặt đã được lưu',
          });
        },
        error: (err) => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Không thể lưu cài đặt',
          });
        },
      });
  }

  resetSettings(): void {
    this.settingsForm.patchValue({
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Ho_Chi_Minh',
      theme: 'auto',
      language: 'vi',
      layoutDensity: 'comfortable',
      notificationsInApp: true,
      notificationsEmail: true,
      notificationsPush: false,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
