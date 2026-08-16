import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService, ThemeService, LanguageService } from '@open-erp/shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonSpinner, TranslocoModule],
  templateUrl: './login.page.html'
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  themeService = inject(ThemeService);
  langService = inject(LanguageService);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    username: ['admin', [Validators.required]],
    password: ['123456', [Validators.required]],
    tenantId: ['vn9melody']
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, password, tenantId } = this.loginForm.value;

    this.authService.login({
      username: username!,
      password: password!,
      tenantId: tenantId || 'vn9melody'
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/tabs/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 0 || err.status === 404) {
          // Demo preview login on mobile
          this.authService.saveAuthData({
            accessToken: 'mock_mobile_jwt_' + Date.now(),
            refreshToken: 'mock_refresh_token',
            tokenType: 'Bearer',
            expiresInSeconds: 3600,
            user: {
              userId: 1,
              tenantId: tenantId || 'vn9melody',
              username: username || 'admin',
              email: `${username || 'admin'}@vn9melody.com`,
              roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
              permissions: ['ORDER_VIEW', 'ORDER_CREATE', 'USER_VIEW']
            }
          });
          this.router.navigate(['/tabs/dashboard']);
        } else {
          this.errorMessage.set(err.error?.message || this.transloco.translate('auth.loginFailed'));
        }
      }
    });
  }
}
