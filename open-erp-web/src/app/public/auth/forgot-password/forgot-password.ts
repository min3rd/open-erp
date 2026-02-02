import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService, ForgotPasswordDto } from '../../../../core/services/auth-service';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../../../../core/interfaces/error.types';

interface ForgotPasswordForm {
  email: FormControl<string>;
}

@Component({
  selector: 'public-forgot-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgOptimizedImage,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './forgot-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly isSubmitting = signal(false);
  protected readonly emailSent = signal(false);
  protected readonly resendCooldown = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly forgotPasswordForm = new FormGroup<ForgotPasswordForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  ngOnDestroy(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  protected getFieldError(fieldName: keyof ForgotPasswordForm): string | null {
    const control = this.forgotPasswordForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) {
      return `forgotPassword.form.${fieldName}.errors.required`;
    }
    if (errors['email']) {
      return `forgotPassword.form.${fieldName}.errors.email`;
    }
    return null;
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  protected onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    if (this.resendCooldown() > 0) {
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.forgotPasswordForm.value;
    this.authService
      .forgotPassword({
        email: formValue.email!,
      })
      .subscribe({
        next: (response: any) => {
          // Always show success message to prevent user enumeration
          this.emailSent.set(true);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('forgotPassword.messages.emailSent'),
          });
          this.startResendCooldown();
        },
        error: () => {
          // Always show success message to prevent user enumeration
          this.emailSent.set(true);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('forgotPassword.messages.emailSent'),
          });
          this.startResendCooldown();
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);

    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }

    this.resendTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }
}
