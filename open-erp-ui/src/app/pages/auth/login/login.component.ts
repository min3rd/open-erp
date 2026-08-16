import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslocoModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
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
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        // If backend is running standalone or mock demo login
        if (err.status === 0 || err.status === 404) {
          // Allow mock login for frontend preview
          this.authService.saveAuthData({
            accessToken: 'mock_jwt_token_' + Date.now(),
            refreshToken: 'mock_refresh_token',
            tokenType: 'Bearer',
            expiresInSeconds: 3600,
            user: {
              userId: 1,
              tenantId: tenantId || 'vn9melody',
              username: username || 'admin',
              email: `${username || 'admin'}@vn9melody.com`,
              roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
              permissions: ['ORDER_VIEW', 'ORDER_CREATE', 'USER_VIEW', 'USER_MANAGE']
            }
          });
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage.set(err.error?.message || this.transloco.translate('auth.loginFailed'));
        }
      }
    });
  }
}
