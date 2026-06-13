import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { InputComponent, ButtonComponent, IconComponent } from '@open-erp/shared-ui';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    InputComponent,
    ButtonComponent,
    IconComponent,
  ],
  template: `
    <div
      *transloco="let t"
      class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      <!-- Top header / Settings bar -->
      <div class="absolute top-4 right-4 flex items-center gap-4">
        <!-- Language Selector -->
        <select
          [value]="currentLang()"
          (change)="changeLanguage($event)"
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-rose-gold-500 outline-none"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
        </select>

        <!-- Theme Toggle -->
        <button
          (click)="toggleDarkMode()"
          class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label="Toggle Theme"
        >
          @if (isDarkMode()) {
            <oerp-icon name="sun" [size]="16" class="text-amber-500"></oerp-icon>
          } @else {
            <oerp-icon name="moon" [size]="16" class="text-slate-500"></oerp-icon>
          }
        </button>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-gold-100 text-rose-gold-500 mb-4 shadow-sm"
        >
          <oerp-icon name="briefcase" [size]="24"></oerp-icon>
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {{ t('auth.register_title') }}
        </h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {{ t('auth.register_subtitle') }}
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          class="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-800 sm:px-10"
        >
          <!-- Success Status -->
          @if (successMessage()) {
            <div
              class="p-4 mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm font-medium animate-fade-in flex items-start gap-3"
            >
              <oerp-icon
                name="check-circle"
                [size]="20"
                class="text-emerald-500 mt-0.5 shrink-0"
              ></oerp-icon>
              <div>{{ successMessage() }}</div>
            </div>
          }

          <!-- Global Error Status -->
          @if (errorMessage()) {
            <div
              class="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 text-sm font-medium animate-fade-in flex items-start gap-3"
            >
              <oerp-icon
                name="alert-circle"
                [size]="20"
                class="text-red-500 mt-0.5 shrink-0"
              ></oerp-icon>
              <div>{{ errorMessage() }}</div>
            </div>
          }

          <!-- Form -->
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <oerp-input
              [label]="t('auth.company_name')"
              [placeholder]="t('auth.company_name')"
              [control]="getControl('companyName')"
              [errorMessage]="getErrorMessage('companyName')"
            ></oerp-input>

            <oerp-input
              [label]="t('auth.email')"
              [placeholder]="t('auth.email')"
              [control]="getControl('email')"
              [errorMessage]="getErrorMessage('email')"
              prefixIcon="mail"
            ></oerp-input>

            <oerp-input
              [label]="t('auth.password')"
              [placeholder]="t('auth.password')"
              type="password"
              [control]="getControl('password')"
              [errorMessage]="getErrorMessage('password')"
              prefixIcon="lock"
            ></oerp-input>

            @if (passwordValue()) {
              <div class="mt-2 space-y-1.5 animate-fade-in">
                <!-- Strength Bars -->
                <div class="flex gap-1 h-1">
                  <div
                    [ngClass]="[
                      'flex-1 rounded-full transition-all duration-300',
                      passwordStrength() === 'weak'
                        ? 'bg-red-500'
                        : passwordStrength() === 'medium'
                          ? 'bg-amber-500'
                          : passwordStrength() === 'strong'
                            ? 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700',
                    ]"
                  ></div>
                  <div
                    [ngClass]="[
                      'flex-1 rounded-full transition-all duration-300',
                      passwordStrength() === 'medium'
                        ? 'bg-amber-500'
                        : passwordStrength() === 'strong'
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-700',
                    ]"
                  ></div>
                  <div
                    [ngClass]="[
                      'flex-1 rounded-full transition-all duration-300',
                      passwordStrength() === 'strong'
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-700',
                    ]"
                  ></div>
                </div>
                <!-- Strength Text Label -->
                <div class="flex justify-between items-center text-xs font-semibold select-none">
                  <span class="text-slate-500 dark:text-slate-400"
                    >{{ t('auth.password_strength') }}:</span
                  >
                  <span
                    [ngClass]="[
                      passwordStrength() === 'weak'
                        ? 'text-red-500'
                        : passwordStrength() === 'medium'
                          ? 'text-amber-500'
                          : passwordStrength() === 'strong'
                            ? 'text-emerald-500'
                            : '',
                    ]"
                  >
                    {{
                      passwordStrength() === 'weak'
                        ? t('auth.password_weak')
                        : passwordStrength() === 'medium'
                          ? t('auth.password_medium')
                          : passwordStrength() === 'strong'
                            ? t('auth.password_strong')
                            : ''
                    }}
                  </span>
                </div>
              </div>
            }

            <div>
              <oerp-input
                [label]="t('auth.subdomain')"
                [placeholder]="t('auth.subdomain')"
                [control]="getControl('subdomain')"
                [errorMessage]="getErrorMessage('subdomain')"
                prefixIcon="globe"
              ></oerp-input>

              <div class="mt-1.5 flex justify-between items-center text-xs select-none">
                <!-- Subdomain check indicator -->
                @if (checkingSubdomain()) {
                  <span class="text-slate-400 dark:text-slate-500 animate-pulse">
                    {{ t('validation.checking_subdomain') }}
                  </span>
                } @else if (subdomainAvailable() === true) {
                  <span class="text-emerald-500 font-medium">
                    {{ t('validation.subdomain_available') }}
                  </span>
                } @else if (subdomainAvailable() === false) {
                  <span class="text-red-500 font-medium">
                    {{ t('validation.subdomain_unavailable') }}
                  </span>
                } @else {
                  <span class="text-slate-400 dark:text-slate-500">
                    {{ t('auth.subdomain_hint') }}
                  </span>
                }
              </div>
            </div>

            <oerp-input
              [label]="t('auth.phone_optional')"
              [placeholder]="t('auth.phone')"
              [control]="getControl('phone')"
              [errorMessage]="getErrorMessage('phone')"
              prefixIcon="phone"
            ></oerp-input>

            <div class="pt-2">
              <oerp-button
                type="submit"
                [label]="isLoading() ? t('auth.processing') : t('auth.submit')"
                [isLoading]="isLoading()"
                [disabled]="
                  registerForm.invalid || checkingSubdomain() || subdomainAvailable() === false
                "
                class="w-full flex justify-center"
              ></oerp-button>
            </div>
          </form>

          <div class="mt-6 text-center text-sm">
            <span class="text-slate-500 dark:text-slate-400">
              {{ t('auth.already_have_account') }}
            </span>
            <a
              href="javascript:void(0)"
              class="font-semibold text-rose-gold-500 hover:text-rose-gold-600 ml-1 transition"
            >
              {{ t('auth.login_now') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private translocoService = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  registerForm: FormGroup;
  isDarkMode = signal<boolean>(false);
  currentLang = signal<string>('vi');
  passwordValue = signal<string>('');

  // Password strength computation signal
  passwordStrength = computed(() => {
    const password = this.passwordValue();
    if (!password) return null;

    let score = 0;

    // Check length
    if (password.length >= 8) score++;

    // Check numbers and letters
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    if (hasLetters && hasNumbers) score++;

    // Check special chars
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    if (hasSpecial) score++;

    if (score <= 1) return 'weak';
    if (score === 2) return 'medium';
    return 'strong';
  });

  // Request state signals
  isLoading = signal<boolean>(false);
  checkingSubdomain = signal<boolean>(false);
  subdomainAvailable = signal<boolean | null>(null);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor() {
    this.registerForm = this.fb.group({
      companyName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+$/)]],
      phone: [''],
    });

    // Sync password input value with passwordValue signal in a memory-safe manner
    this.registerForm
      .get('password')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((val) => {
        this.passwordValue.set(val || '');
      });

    // Load theme setting from localStorage
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load language setting from localStorage
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
      this.translocoService.setActiveLang(savedLang);
      this.currentLang.set(savedLang);
    } else {
      const activeLang = this.translocoService.getActiveLang() || 'vi';
      this.currentLang.set(activeLang);
      localStorage.setItem('lang', activeLang);
    }
  }

  ngOnInit() {
    // Watch subdomain changes with debounce to check availability
    const subdomainControl = this.registerForm.get('subdomain');
    if (subdomainControl) {
      subdomainControl.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
          switchMap((val) => {
            const value = (val || '').trim().toLowerCase();

            if (!value || subdomainControl.invalid) {
              this.subdomainAvailable.set(null);
              this.checkingSubdomain.set(false);
              return of(null);
            }

            this.checkingSubdomain.set(true);
            this.subdomainAvailable.set(null);
            this.errorMessage.set('');

            return this.http
              .get<{
                success: boolean;
                data: { available: boolean };
              }>(`http://localhost:3000/api/v1/auth/check-subdomain?subdomain=${value}`)
              .pipe(
                catchError(() => {
                  this.checkingSubdomain.set(false);
                  return of({ success: false, data: { available: false } });
                }),
              );
          }),
        )
        .subscribe((res) => {
          this.checkingSubdomain.set(false);
          if (res && res.success) {
            this.subdomainAvailable.set(res.data.available);
            if (!res.data.available) {
              subdomainControl.setErrors({ unavailable: true });
            }
          } else {
            this.subdomainAvailable.set(null);
          }
        });
    }
  }

  getControl(name: string): FormControl {
    return this.registerForm.get(name) as FormControl;
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors) return '';
    const errors = control.errors;

    const snakeKey = controlName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    if (errors['required'])
      return this.translocoService.translate(`validation.${snakeKey}_required`);
    if (errors['email']) return this.translocoService.translate('validation.email_invalid');
    if (errors['minlength'])
      return this.translocoService.translate('validation.password_min_length');
    if (errors['pattern']) return this.translocoService.translate('validation.subdomain_invalid');
    if (errors['unavailable'])
      return this.translocoService.translate('validation.subdomain_unavailable');
    return '';
  }

  toggleDarkMode() {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  changeLanguage(event: Event) {
    const select = event.target as HTMLSelectElement;
    const lang = select.value;
    this.translocoService.setActiveLang(lang);
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
  }

  onSubmit() {
    if (
      this.registerForm.invalid ||
      this.checkingSubdomain() ||
      this.subdomainAvailable() === false
    ) {
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formVal = this.registerForm.value;

    this.http
      .post<{ success: boolean; messageKey?: string; error?: { messageKey?: string } }>(
        'http://localhost:3000/api/v1/auth/register',
        formVal,
      )
      .pipe(
        catchError((err) => {
          this.isLoading.set(false);
          const errPayload = err.error || {};
          const msgKey = errPayload.error?.messageKey || 'validation.error_occurred';
          this.errorMessage.set(this.translocoService.translate(msgKey));
          return of(null);
        }),
      )
      .subscribe((res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          const msgKey = res.messageKey || 'auth.register_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          this.registerForm.reset();
          this.subdomainAvailable.set(null);
        }
      });
  }
}
