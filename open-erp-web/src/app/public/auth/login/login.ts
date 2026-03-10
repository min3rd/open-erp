import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService, LoginDto, LoginResponse } from '../../../../core/services/auth-service';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../../../../core/api';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'public-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgOptimizedImage,
    ButtonModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly isSubmitting = signal(false);

  protected readonly loginForm = new FormGroup<LoginForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  protected getFieldError(fieldName: keyof LoginForm): string | null {
    const control = this.loginForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) {
      return `login.form.${fieldName}.errors.required`;
    }
    if (errors['minlength']) {
      return `login.form.${fieldName}.errors.minlength`;
    }
    return null;
  }

  protected navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  protected navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.loginForm.value as LoginDto;

      this.authService.login(formValue).subscribe({
        next: async (response: ApiResponse<LoginResponse>) => {
          // Success case
          const loginResponse = response.data!;

          // If user has 2FA enabled, redirect to 2FA screen
          if (loginResponse.needs2fa && loginResponse.tempAuthToken) {
            this.router.navigate(['/auth/2fa'], {
              queryParams: { token: loginResponse.tempAuthToken },
            });
            this.isSubmitting.set(false);
            return;
          }

          try {
            // Encrypt and store tokens
            await this.authService.encryptAndStoreTokens({
              accessToken: loginResponse.accessToken!,
              refreshToken: loginResponse.refreshToken!,
            });

            // Store session ID for session management (revoke other sessions)
            if (loginResponse.sessionId) {
              this.authService.storeSessionId(loginResponse.sessionId);
            }

            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('login.messages.loginSuccess'),
            });

            // Redirect to the original URL or dashboard after successful login
            const redirectURL = this.route.snapshot.queryParams['redirectURL'];
            if (redirectURL) {
              this.router.navigateByUrl(redirectURL);
            } else {
              this.router.navigate(['/']);
            }
          } catch (encryptError) {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('login.messages.loginError'),
              detail: 'Failed to securely store authentication tokens',
            });
            this.isSubmitting.set(false);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('login.messages.loginError'),
          });
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('login.messages.loginError'),
      });
      this.isSubmitting.set(false);
    }
  }
}
