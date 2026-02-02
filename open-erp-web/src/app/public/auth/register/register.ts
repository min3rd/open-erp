import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService, RegisterDto } from '../../../../core/services/auth-service';
import { catchError, of } from 'rxjs';
import { MessageService } from 'primeng/api';

interface RegisterForm {
  email: FormControl<string>;
  fullName: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  termsAccepted: FormControl<boolean>;
}

@Component({
  selector: 'public-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgOptimizedImage,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly showTermsDialog = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly registerForm = new FormGroup<RegisterForm>(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      fullName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), this.passwordStrengthValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      termsAccepted: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    { validators: this.passwordMatchValidator }
  );

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

  protected getFieldError(fieldName: keyof RegisterForm): string | null {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) {
      return `register.form.${fieldName}.errors.required`;
    }
    if (errors['email']) {
      return `register.form.${fieldName}.errors.email`;
    }
    if (errors['minlength']) {
      return `register.form.${fieldName}.errors.minlength`;
    }
    if (errors['pattern']) {
      return `register.form.${fieldName}.errors.pattern`;
    }
    return null;
  }

  protected getConfirmPasswordError(): string | null {
    const control = this.registerForm.get('confirmPassword');
    if (!control || !control.touched) {
      return null;
    }

    if (control.errors?.['required']) {
      return 'register.form.confirmPassword.errors.required';
    }

    if (this.registerForm.errors?.['passwordMismatch']) {
      return 'register.form.confirmPassword.errors.mismatch';
    }

    return null;
  }

  protected openTermsDialog(): void {
    this.showTermsDialog.set(true);
  }

  protected closeTermsDialog(): void {
    this.showTermsDialog.set(false);
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  protected async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      // TODO: Implement actual API call when backend is ready
      const formValue = this.registerForm.value as RegisterDto;
      this.authService
        .register({
          email: formValue.email,
          fullName: formValue.fullName,
          password: formValue.password,
        })
        .subscribe((e: any) => {
          if (e.error) {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate(e.error.errorCode ?? 'error.unknown'),
              detail:
                this.translocoService.translate(e.error.message, e.error.details) +
                '\n' +
                e.error.supportUrl,
            });
            return;
          }
          // Navigate to login or verification page
          this.router.navigate(['/auth/verify-account'], {
            queryParams: { email: formValue.email },
          });
        });
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
