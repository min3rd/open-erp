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
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

import { MeService } from '../../../../core/services/me-service';
import type { MeSettings } from '../me.types';
import { LanguageService, LanguageOption } from '../../../../core/services/language.service';
import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'me-settings',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
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
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private userSettingsService = inject(UserSettingsService);
  private themeService = inject(ThemeService);
  private destroy$ = new Subject<void>();

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly languages = signal<{ label: string; value: string }[]>([]);

  settingsForm!: FormGroup;

  readonly dateFormats = [
    { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  ];

  readonly timeFormats = [
    { label: '24h (HH:mm)', value: 'HH:mm' },
    { label: '12h (hh:mm A)', value: 'hh:mm A' },
  ];

  get themes() {
    return [
      { label: this.translocoService.translate('me.settings.display.themes.auto'), value: 'auto' },
      {
        label: this.translocoService.translate('me.settings.display.themes.light'),
        value: 'light',
      },
      { label: this.translocoService.translate('me.settings.display.themes.dark'), value: 'dark' },
    ];
  }

  get densities() {
    return [
      {
        label: this.translocoService.translate('me.settings.display.densities.comfortable'),
        value: 'comfortable',
      },
      {
        label: this.translocoService.translate('me.settings.display.densities.compact'),
        value: 'compact',
      },
    ];
  }

  readonly timezones = [
    { label: 'Asia/Ho_Chi_Minh (GMT+7)', value: 'Asia/Ho_Chi_Minh' },
    { label: 'Asia/Bangkok (GMT+7)', value: 'Asia/Bangkok' },
    { label: 'UTC', value: 'UTC' },
    { label: 'America/New_York (EST)', value: 'America/New_York' },
    { label: 'Europe/London (GMT)', value: 'Europe/London' },
    { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  ];

  ngOnInit(): void {
    // Load available languages from the language service
    this.languageService
      .loadLanguages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (langs: LanguageOption[]) => {
          this.languages.set(langs.map((l) => ({ label: l.label, value: l.code })));
        },
      });

    this.settingsForm = this.fb.group({
      dateFormat: ['DD/MM/YYYY'],
      timeFormat: ['HH:mm'],
      locale: ['vi'],
      timezone: ['Asia/Ho_Chi_Minh'],
      theme: [this.themeService.theme()],
      language: ['vi'],
      layoutDensity: ['comfortable'],
      notificationsInApp: [true],
      notificationsEmail: [true],
      notificationsPush: [false],
    });

    // Live preview: apply theme immediately as user selects it
    this.settingsForm
      .get('theme')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        if (theme) {
          this.themeService.applyTheme(theme, false);
        }
      });

    this.meService
      .getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.settingsForm.patchValue({
            dateFormat: settings.dateFormat || 'DD/MM/YYYY',
            timeFormat: settings.timeFormat || 'HH:mm',
            locale: settings.locale || settings.language || 'vi',
            timezone: settings.timezone || 'Asia/Ho_Chi_Minh',
            theme: settings.theme || 'auto',
            language: settings.language || 'vi',
            layoutDensity: settings.layoutDensity || 'comfortable',
            notificationsInApp: settings.notificationsInApp !== false,
            notificationsEmail: settings.notificationsEmail !== false,
            notificationsPush: settings.notificationsPush === true,
          });
          // Cache the loaded settings so the date pipe can use them immediately
          this.userSettingsService.applyFromMeSettings(settings);
          // Apply backend theme immediately
          if (settings.theme) {
            this.themeService.applyTheme(settings.theme);
          }
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
          // Apply settings immediately to the UI
          if (values.language) {
            this.translocoService.setActiveLang(values.language);
            localStorage.setItem('app.lang', values.language);
          }
          if (values.theme) {
            // Persist theme choice (live preview applied it without persisting)
            this.themeService.applyTheme(values.theme);
          }
          // Update the shared date/time config so pipes re-render immediately
          this.userSettingsService.applyFromMeSettings(values);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('common.success'),
            detail: this.translocoService.translate('me.settings.messages.saveSuccess'),
          });
        },
        error: (err) => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('common.error'),
            detail:
              err.message || this.translocoService.translate('me.settings.messages.saveError'),
          });
        },
      });
  }

  resetSettings(): void {
    const defaultTheme = 'auto';
    this.settingsForm.patchValue({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      locale: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      theme: defaultTheme,
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
