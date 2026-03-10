import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  AuthService,
  TwoFARecoveryDisableDto,
  TwoFALoginResponse,
} from '../../../../core/services/auth-service';
import { MessageService } from 'primeng/api';
import { ApiResponse } from '../../../../core/api';

interface TwoFARecoveryForm {
  recoveryCode: FormControl<string>;
}

@Component({
  selector: 'public-two-fa-recovery',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgOptimizedImage,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './two-fa-recovery.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFaRecovery implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly isSubmitting = signal(false);
  protected tempAuthToken = signal<string | null>(null);

  protected readonly recoveryForm = new FormGroup<TwoFARecoveryForm>({
    recoveryCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
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

  protected getFieldError(fieldName: keyof TwoFARecoveryForm): string | null {
    const control = this.recoveryForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }
    const errors = control.errors;
    if (errors['required']) {
      return 'twoFaRecovery.form.recoveryCode.errors.required';
    }
    return null;
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  protected navigateTo2FA(): void {
    const token = this.tempAuthToken();
    this.router.navigate(['/auth/2fa'], {
      queryParams: token ? { token } : {},
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    const token = this.tempAuthToken();
    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isSubmitting.set(true);

    const payload: TwoFARecoveryDisableDto = {
      tempAuthToken: token,
      recoveryCode: this.recoveryForm.value.recoveryCode!,
    };

    this.authService.disableWith2FARecovery(payload).subscribe({
      next: async (response: ApiResponse<TwoFALoginResponse>) => {
        const loginResponse = response.data!;
        try {
          await this.authService.encryptAndStoreTokens({
            accessToken: loginResponse.accessToken,
            refreshToken: loginResponse.refreshToken,
          });
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('twoFaRecovery.messages.success'),
          });
          this.router.navigate(['/']);
        } catch {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('twoFaRecovery.messages.storageError'),
          });
          this.isSubmitting.set(false);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('twoFaRecovery.messages.invalidCode'),
        });
        this.isSubmitting.set(false);
      },
    });
  }
}
