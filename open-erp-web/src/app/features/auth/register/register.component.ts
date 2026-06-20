import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { InputComponent, ButtonComponent, IconComponent, AuthService, GuideTourComponent, TourStep } from '@open-erp/shared';

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
    GuideTourComponent,
  ],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  registerForm: FormGroup;
  isDarkMode = signal<boolean>(false);
  currentLang = signal<string>('vi');
  passwordValue = signal<string>('');
  showGuide = signal<boolean>(false);

  steps: TourStep[] = [
    {
      title: 'guide.register_title',
      description: 'guide.register_desc',
      selector: '#register-card'
    },
    {
      title: 'guide.register_settings_title',
      description: 'guide.register_settings_desc',
      selector: '#settings-bar'
    }
  ];

  triggerGuide() {
    this.showGuide.set(true);
  }

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
      subdomain: ['', [Validators.pattern(/^[a-z0-9]+$/)]],
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
    const seen = localStorage.getItem('guide_seen_register');
    if (seen !== 'true') {
      setTimeout(() => {
        this.showGuide.set(true);
      }, 500);
    }

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

            return this.authService.checkSubdomain(value).pipe(
              catchError(() => {
                return of(false);
              }),
            );
          }),
        )
        .subscribe((available) => {
          this.checkingSubdomain.set(false);
          this.subdomainAvailable.set(available);
          if (available === false) {
            subdomainControl.setErrors({ unavailable: true });
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

    this.authService.register(formVal).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          const msgKey = res.messageKey || 'auth.register_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          this.registerForm.reset();
          this.subdomainAvailable.set(null);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errPayload = err.error || {};
        const msgKey = errPayload.error?.messageKey || 'validation.error_occurred';
        this.errorMessage.set(this.translocoService.translate(msgKey));
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegisterUser() {
    this.router.navigate(['/register/user']);
  }
}
