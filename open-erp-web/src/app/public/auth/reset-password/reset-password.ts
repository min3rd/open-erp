import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService, ResetPasswordDto } from '../../../../core/services/auth-service';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../../../../core/interfaces/error.types';

interface ResetPasswordForm {
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: 'public-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgOptimizedImage,
    ButtonModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly isSubmitting = signal(false);
  protected readonly token = signal<string | null>(null);
  protected readonly tokenValid = signal(true);

  private navigationTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly resetPasswordForm = new FormGroup<ResetPasswordForm>(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), this.passwordStrengthValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    // Get token from query params
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (!tokenParam) {
      this.tokenValid.set(false);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('resetPassword.messages.invalidToken'),
      });
    } else {
      this.token.set(tokenParam);
    }
  }

  ngOnDestroy(): void {
    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
      this.navigationTimer = null;
    }
  }

  private passwordStrengthValidator(control: FormControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? { pattern: true } : null;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  protected getFieldError(fieldName: keyof ResetPasswordForm): string | null {
    const control = this.resetPasswordForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) {
      return `resetPassword.form.${fieldName}.errors.required`;
    }
    if (errors['minlength']) {
      return `resetPassword.form.${fieldName}.errors.minlength`;
    }
    if (errors['pattern']) {
      return `resetPassword.form.${fieldName}.errors.pattern`;
    }
    return null;
  }

  protected getConfirmPasswordError(): string | null {
    const control = this.resetPasswordForm.get('confirmPassword');
    if (!control || !control.touched) {
      return null;
    }

    if (control.errors?.['required']) {
      return 'resetPassword.form.confirmPassword.errors.required';
    }

    if (this.resetPasswordForm.errors?.['passwordMismatch']) {
      return 'resetPassword.form.confirmPassword.errors.mismatch';
    }

    return null;
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  protected navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  protected onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.token()) {
      this.tokenValid.set(false);
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.resetPasswordForm.value;
    this.authService
      .resetPassword({
        token: this.token()!,
        password: formValue.password!,
      })
      .subscribe({
        next: (response: any) => {
          if (response.error) {
            // Check if token is invalid or expired
            if (
              response.error.errorCode === 'INVALID_TOKEN' ||
              response.error.errorCode === 'TOKEN_EXPIRED'
            ) {
              this.tokenValid.set(false);
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('resetPassword.messages.tokenExpired'),
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('resetPassword.messages.resetError'),
                detail: this.translocoService.translate(
                  response.error.message ?? 'error.unknown',
                  response.error.details,
                ),
              });
            }
          } else {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('resetPassword.messages.resetSuccess'),
            });
            // Navigate to login after 2 seconds
            this.navigationTimer = setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          }
        },
        error: (error) => {
          // Check if error indicates invalid/expired token
          if (error.status === 400 || error.status === 401) {
            this.tokenValid.set(false);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('resetPassword.messages.tokenExpired'),
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('resetPassword.messages.resetError'),
            });
          }
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
