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
import { HttpClient } from '@angular/common/http';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { InputComponent, ButtonComponent, IconComponent, AlertComponent, AuthService, GuideTourComponent, TourStep } from '@open-erp/shared';

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
    GuideTourComponent,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);

  loginForm!: FormGroup;
  isDarkMode = signal<boolean>(false);
  currentLang = signal<string>('vi');
  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  showGuide = signal<boolean>(false);

  requireTenantSelection = signal<boolean>(false);
  availableTenants = signal<any[]>([]);

  currentOAuthProvider = signal<string | null>(null);
  currentOAuthToken = signal<string | null>(null);
  currentOAuthMicrosoftAccessToken = signal<string | null>(null);

  steps: TourStep[] = [
    {
      title: 'guide.login_title',
      description: 'guide.login_desc',
      selector: '#login-card'
    },
    {
      title: 'guide.login_settings_title',
      description: 'guide.login_settings_desc',
      selector: '#settings-bar'
    }
  ];

  triggerGuide() {
    this.showGuide.set(true);
  }

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

    const seen = localStorage.getItem('guide_seen_login');
    if (seen !== 'true') {
      setTimeout(() => {
        this.showGuide.set(true);
      }, 500);
    }
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
          if (res.data?.requireTenantSelection) {
            this.requireTenantSelection.set(true);
            this.availableTenants.set(res.data.tenants || []);
            return;
          }

          const msgKey = res.messageKey || 'auth.login_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          
          this.http.get<any>('/api/v1/org/departments').subscribe({
            next: (deptRes) => {
              const hasDepts = deptRes.success && deptRes.data && deptRes.data.length > 0;
              const isAdmin = this.authService.getRole() === 'admin';
              setTimeout(() => {
                if (!hasDepts && isAdmin) {
                  this.router.navigate(['/org-structure']);
                } else {
                  this.router.navigate(['/home']);
                }
              }, 1500);
            },
            error: () => {
              setTimeout(() => {
                this.router.navigate(['/home']);
              }, 1500);
            }
          });
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

  selectTenant(tenant: any) {
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.currentOAuthProvider()) {
      this.handleOAuthLogin(
        this.currentOAuthProvider()!,
        this.currentOAuthToken()!,
        tenant.id,
        this.currentOAuthMicrosoftAccessToken() || undefined,
      );
      return;
    }

    const formVal = this.loginForm.value;

    this.authService.selectTenant({
      email: formVal.email,
      password: formVal.password,
      tenantId: tenant.id,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          const msgKey = res.messageKey || 'auth.login_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          
          this.http.get<any>('/api/v1/org/departments').subscribe({
            next: (deptRes) => {
              const hasDepts = deptRes.success && deptRes.data && deptRes.data.length > 0;
              const isAdmin = this.authService.getRole() === 'admin';
              setTimeout(() => {
                if (!hasDepts && isAdmin) {
                  this.router.navigate(['/org-structure']);
                } else {
                  this.router.navigate(['/home']);
                }
              }, 1500);
            },
            error: () => {
              setTimeout(() => {
                this.router.navigate(['/home']);
              }, 1500);
            }
          });
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errPayload = err.error || {};
        const msgKey = errPayload.error?.messageKey || 'auth.invalid_credentials';
        this.errorMessage.set(this.translocoService.translate(msgKey));
      }
    });
  }

  backToLoginForm() {
    this.requireTenantSelection.set(false);
    this.availableTenants.set([]);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.currentOAuthProvider.set(null);
    this.currentOAuthToken.set(null);
    this.currentOAuthMicrosoftAccessToken.set(null);
  }

  loginWithGoogle() {
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const mockEmail = window.prompt(
      'Đăng nhập với Google (Development Mode)\n\nNhập email Google của bạn:',
      'user@example.com'
    );

    if (!mockEmail) {
      this.isLoading.set(false);
      return;
    }

    const idToken = `mock_google_${mockEmail}`;
    this.handleOAuthLogin('google', idToken);
  }

  loginWithMicrosoft() {
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const mockEmail = window.prompt(
      'Đăng nhập với Microsoft (Development Mode)\n\nNhập email Microsoft của bạn:',
      'user@outlook.com'
    );

    if (!mockEmail) {
      this.isLoading.set(false);
      return;
    }

    const idToken = `mock_microsoft_${mockEmail}`;
    const accessToken = 'mock_ms_access_token';
    this.handleOAuthLogin('microsoft', idToken, undefined, accessToken);
  }

  handleOAuthLogin(provider: string, token: string, tenantId?: string, microsoftAccessToken?: string) {
    const request = provider === 'google'
      ? this.authService.loginWithGoogle(token, tenantId)
      : this.authService.loginWithMicrosoft(microsoftAccessToken || '', token, tenantId);

    request.subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          if (res.data?.requireTenantSelection) {
            this.currentOAuthProvider.set(provider);
            this.currentOAuthToken.set(token);
            if (microsoftAccessToken) {
              this.currentOAuthMicrosoftAccessToken.set(microsoftAccessToken);
            }
            this.requireTenantSelection.set(true);
            this.availableTenants.set(res.data.tenants || []);
            return;
          }

          const msgKey = res.messageKey || 'auth.login_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          
          this.http.get<any>('/api/v1/org/departments').subscribe({
            next: (deptRes) => {
              const hasDepts = deptRes.success && deptRes.data && deptRes.data.length > 0;
              const isAdmin = this.authService.getRole() === 'admin';
              setTimeout(() => {
                if (!hasDepts && isAdmin) {
                  this.router.navigate(['/org-structure']);
                } else {
                  this.router.navigate(['/home']);
                }
              }, 1500);
            },
            error: () => {
              setTimeout(() => {
                this.router.navigate(['/home']);
              }, 1500);
            }
          });
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errPayload = err.error || {};
        const msgKey = errPayload.error?.messageKey || 'auth.invalid_credentials';
        this.errorMessage.set(this.translocoService.translate(msgKey));
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToRegisterUser() {
    this.router.navigate(['/register/user']);
  }
}
