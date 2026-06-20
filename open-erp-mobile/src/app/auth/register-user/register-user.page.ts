import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
} from '@ionic/angular/standalone';
import { InputComponent, ButtonComponent, IconComponent, AuthService } from '@open-erp/shared';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.page.html',
  styleUrls: ['./register-user.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    InputComponent,
    ButtonComponent,
    IconComponent,
  ],
})
export class RegisterUserPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);

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
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
    const isDark = savedTheme === 'dark';
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

  ngOnInit() {}

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
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formVal = this.registerForm.value;

    this.authService.registerUser(formVal).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          const msgKey = res.messageKey || 'auth.user_register_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          this.registerForm.reset();
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
}
