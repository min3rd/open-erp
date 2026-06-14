import { Component, OnInit, signal, inject } from '@angular/core';
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
import { InputComponent, ButtonComponent, IconComponent, AlertComponent, AuthService } from '@open-erp/shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    InputComponent,
    ButtonComponent,
    IconComponent,
    AlertComponent,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);

  loginForm!: FormGroup;
  isDarkMode = signal<boolean>(false);
  currentLang = signal<string>('vi');
  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    // 1. Load language preference
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
      this.translocoService.setActiveLang(savedLang);
      this.currentLang.set(savedLang);
    } else {
      const activeLang = this.translocoService.getActiveLang() || 'vi';
      this.currentLang.set(activeLang);
    }

    // 2. Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.isDarkMode.set(savedTheme === 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Initialize Form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  getControl(name: string): FormControl {
    return this.loginForm.get(name) as FormControl;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
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
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formVal = this.loginForm.value;

    this.authService.login(formVal).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          const msgKey = res.messageKey || 'auth.login_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          
          setTimeout(() => {
            this.router.navigate(['/org-structure']);
          }, 1500);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errPayload = err.error || {};
        const msgKey = errPayload.error?.messageKey || 'auth.invalid_credentials';
        this.errorMessage.set(this.translocoService.translate(msgKey));
      },
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
