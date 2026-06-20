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
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
} from '@ionic/angular/standalone';
import { InputComponent, ButtonComponent, IconComponent, AuthService, GuideTourComponent, TourStep } from '@open-erp/shared';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    GuideTourComponent,
  ],
})
export class LoginPage implements OnInit {
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

  steps: TourStep[] = [
    {
      title: 'guide.login_mobile_title',
      description: 'guide.login_mobile_desc',
      selector: '#login-card-mobile'
    },
    {
      title: 'guide.login_mobile_settings_title',
      description: 'guide.login_mobile_settings_desc',
      selector: '#settings-bar-mobile'
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
      document.documentElement.classList.add('dark', 'ion-palette-dark');
    } else {
      document.documentElement.classList.remove('dark', 'ion-palette-dark');
    }

    // 3. Initialize Form (subdomain/workspace is optional)
    this.loginForm = this.fb.group({
      subdomain: ['', [Validators.pattern(/^[a-z0-9]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // 4. Pre-fill subdomain from localStorage if it exists
    const savedSubdomain = localStorage.getItem('subdomain');
    if (savedSubdomain) {
      this.loginForm.get('subdomain')?.setValue(savedSubdomain);
    }

    const seen = localStorage.getItem('guide_seen_login-mobile');
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
    if (errors['pattern']) return this.translocoService.translate('validation.subdomain_invalid');
    return '';
  }

  toggleDarkMode() {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark', 'ion-palette-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark', 'ion-palette-dark');
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
    const loginPayload = {
      email: formVal.email,
      password: formVal.password
    };

    // Store input subdomain in localStorage before login so that the interceptor sends it
    const sub = (formVal.subdomain || '').trim().toLowerCase();
    if (sub) {
      localStorage.setItem('subdomain', sub);
    } else {
      localStorage.removeItem('subdomain');
    }

    this.authService.login(loginPayload).subscribe({
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
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToRegisterUser() {
    this.router.navigate(['/register/user']);
  }
}
