import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  AuthService,
  TwoFAVerifyDto,
  TwoFALoginResponse,
} from '../../../../core/services/auth-service';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../../../../core/api';

interface TwoFAForm {
  otp: FormControl<string>;
}

@Component({
  selector: 'public-two-fa',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgOptimizedImage,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './two-fa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFa implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly isSubmitting = signal(false);
  protected tempAuthToken = signal<string | null>(null);

  protected readonly twoFAForm = new FormGroup<TwoFAForm>({
    otp: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    }),
  });

  ngOnInit(): void {
    const token = this.activatedRoute.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.tempAuthToken.set(token);
  }

  protected getFieldError(fieldName: keyof TwoFAForm): string | null {
    const control = this.twoFAForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }
    const errors = control.errors;
    if (errors['required']) {
      return 'twoFa.form.otp.errors.required';
    }
    if (errors['minlength'] || errors['maxlength']) {
      return 'twoFa.form.otp.errors.length';
    }
    return null;
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  protected navigateToRecovery(): void {
    const token = this.tempAuthToken();
    this.router.navigate(['/auth/2fa/recovery-disable'], {
      queryParams: token ? { token } : {},
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.twoFAForm.invalid) {
      this.twoFAForm.markAllAsTouched();
      return;
    }

    const token = this.tempAuthToken();
    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isSubmitting.set(true);

    const payload: TwoFAVerifyDto = {
      tempAuthToken: token,
      otp: this.twoFAForm.value.otp!,
    };

    this.authService.verify2FA(payload).subscribe({
      next: async (response: ApiResponse<TwoFALoginResponse>) => {
        const loginResponse = response.data!;
        try {
          await this.authService.encryptAndStoreTokens({
            accessToken: loginResponse.accessToken,
            refreshToken: loginResponse.refreshToken,
          });
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('twoFa.messages.success'),
          });
          this.router.navigate(['/']);
        } catch {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('twoFa.messages.storageError'),
          });
          this.isSubmitting.set(false);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('twoFa.messages.invalidOtp'),
        });
        this.isSubmitting.set(false);
      },
    });
  }
}
