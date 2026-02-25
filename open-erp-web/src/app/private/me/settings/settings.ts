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

  get themes() {
    return [
      { label: this.translocoService.translate('me.settings.display.themes.auto'), value: 'auto' },
      { label: this.translocoService.translate('me.settings.display.themes.light'), value: 'light' },
      { label: this.translocoService.translate('me.settings.display.themes.dark'), value: 'dark' },
    ];
  }

  get densities() {
    return [
      { label: this.translocoService.translate('me.settings.display.densities.comfortable'), value: 'comfortable' },
      { label: this.translocoService.translate('me.settings.display.densities.compact'), value: 'compact' },
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
    this.languageService.loadLanguages().pipe(takeUntil(this.destroy$)).subscribe({
      next: (langs: LanguageOption[]) => {
        this.languages.set(langs.map((l) => ({ label: l.label, value: l.code })));
      },
    });

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
          // Apply settings immediately to the UI
          if (values.language) {
            this.translocoService.setActiveLang(values.language);
            localStorage.setItem('app.lang', values.language);
          }
          if (values.theme) {
            this.applyTheme(values.theme);
          }
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
            detail: err.message || this.translocoService.translate('me.settings.messages.saveError'),
          });
        },
      });
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('app.theme', 'dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      localStorage.setItem('app.theme', 'light');
    } else {
      // auto: follow system preference
      localStorage.setItem('app.theme', 'auto');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
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
