import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Services and types
import { UserDetailService, UserDetail } from '../services/user-detail.service';

interface ResetPasswordForm {
  resetMethod: FormControl<'auto' | 'manual'>;
  password: FormControl<string>;
  forceResetOnNextLogin: FormControl<boolean>;
  revokeSessions: FormControl<boolean>;
  sendEmail: FormControl<boolean>;
  reason: FormControl<string>;
}

interface RevokeSessionsForm {
  revokeRefreshTokens: FormControl<boolean>;
  revokeAllDevices: FormControl<boolean>;
  reason: FormControl<string>;
}

interface BlockUserForm {
  reason: FormControl<string>;
  softBlock: FormControl<boolean>;
  revokeSessions: FormControl<boolean>;
  sendEmail: FormControl<boolean>;
}

interface UnblockUserForm {
  reason: FormControl<string>;
  sendEmail: FormControl<boolean>;
}

@Component({
  selector: 'management-user-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    RadioButtonModule,
    CheckboxModule,
    TextareaModule,
    DialogModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State signals
  protected readonly user = signal<UserDetail | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly generatedPassword = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly passwordStrength = signal<'weak' | 'medium' | 'strong' | 'veryStrong'>('weak');

  // Dialog visibility signals
  protected readonly showResetPasswordDialog = signal(false);
  protected readonly showRevokeSessionsDialog = signal(false);
  protected readonly showBlockUserDialog = signal(false);
  protected readonly showUnblockUserDialog = signal(false);

  // Computed values
  protected readonly isUserBlocked = computed(() => {
    const currentUser = this.user();
    return currentUser?.status === 'blocked';
  });

  protected readonly statusSeverity = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return 'secondary';
    return currentUser.status === 'active' ? 'success' : 'danger';
  });

  // Forms
  protected readonly resetPasswordForm = new FormGroup<ResetPasswordForm>({
    resetMethod: new FormControl<'auto' | 'manual'>('auto', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    forceResetOnNextLogin: new FormControl(false, { nonNullable: true }),
    revokeSessions: new FormControl(true, { nonNullable: true }),
    sendEmail: new FormControl(true, { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true }),
  });

  protected readonly revokeSessionsForm = new FormGroup<RevokeSessionsForm>({
    revokeRefreshTokens: new FormControl(true, { nonNullable: true }),
    revokeAllDevices: new FormControl(true, { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true }),
  });

  protected readonly blockUserForm = new FormGroup<BlockUserForm>({
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    softBlock: new FormControl(false, { nonNullable: true }),
    revokeSessions: new FormControl(true, { nonNullable: true }),
    sendEmail: new FormControl(true, { nonNullable: true }),
  });

  protected readonly unblockUserForm = new FormGroup<UnblockUserForm>({
    reason: new FormControl('', { nonNullable: true }),
    sendEmail: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        this.user.set(data['userDetail']);
      }
    });

    // Subscribe to user updates from service
    this.userDetailService.userUpdated$.pipe(takeUntil(this.destroy$)).subscribe((updatedUser) => {
      if (updatedUser && updatedUser.id === this.user()?.id) {
        this.user.set(updatedUser);
      }
    });

    // Watch reset method changes
    this.resetPasswordForm.controls.resetMethod.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((method) => {
        if (method === 'auto') {
          this.resetPasswordForm.controls.password.clearValidators();
          this.resetPasswordForm.controls.password.setValue('');
          // Generate password immediately when switching to auto mode
          const newPassword = this.generatePassword();
          this.generatedPassword.set(newPassword);
        } else {
          this.resetPasswordForm.controls.password.setValidators([
            Validators.required,
            Validators.minLength(8),
            this.passwordStrengthValidator.bind(this),
          ]);
          // Clear generated password when switching to manual mode
          this.generatedPassword.set(null);
        }
        this.resetPasswordForm.controls.password.updateValueAndValidity();
      });

    // Watch password changes for strength indicator
    this.resetPasswordForm.controls.password.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((password) => {
        this.updatePasswordStrength(password);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Password strength validator
   */
  private passwordStrengthValidator(control: FormControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? { pattern: true } : null;
  }

  /**
   * Update password strength indicator
   */
  private updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength.set('weak');
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    if (strength <= 2) {
      this.passwordStrength.set('weak');
    } else if (strength <= 4) {
      this.passwordStrength.set('medium');
    } else if (strength <= 5) {
      this.passwordStrength.set('strong');
    } else {
      this.passwordStrength.set('veryStrong');
    }
  }

  /**
   * Generate random password using cryptographically secure method
   */
  private generatePassword(): string {
    const length = 12; // Fixed 12 characters for security
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}';

    // Use crypto.getRandomValues for cryptographically secure randomness
    const getRandomChar = (charset: string): string => {
      const randomValues = new Uint32Array(1);
      crypto.getRandomValues(randomValues);
      return charset[randomValues[0] % charset.length];
    };

    // Ensure at least one of each type
    const password: string[] = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(numbers),
      getRandomChar(special),
    ];

    // Fill the rest with random characters from all sets
    const all = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
      password.push(getRandomChar(all));
    }

    // Fisher-Yates shuffle for uniform distribution
    for (let i = password.length - 1; i > 0; i--) {
      const randomValues = new Uint32Array(1);
      crypto.getRandomValues(randomValues);
      const j = randomValues[0] % (i + 1);
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
  }

  /**
   * Toggle password visibility
   */
  protected togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  /**
   * Copy password to clipboard
   */
  protected async copyPassword(): Promise<void> {
    const password =
      this.resetPasswordForm.controls.resetMethod.value === 'auto'
        ? this.generatedPassword()
        : this.resetPasswordForm.controls.password.value;

    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate(
          'userDetail.resetPassword.messages.passwordCopied',
        ),
      });
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  }

  /**
   * Show reset password confirmation dialog
   */
  protected onResetPasswordClick(): void {
    if (this.resetPasswordForm.controls.resetMethod.value === 'manual') {
      this.resetPasswordForm.controls.password.markAsTouched();
      if (this.resetPasswordForm.controls.password.invalid) {
        return;
      }
    }
    this.showResetPasswordDialog.set(true);
  }

  /**
   * Confirm and execute password reset
   */
  protected confirmResetPassword(): void {
    this.showResetPasswordDialog.set(false);
    this.isLoading.set(true);

    const currentUser = this.user();
    if (!currentUser) return;

    const formValue = this.resetPasswordForm.value;
    const isAutoGenerate = formValue.resetMethod === 'auto';

    const requestData: {
      password?: string;
      forceResetOnNextLogin?: boolean;
      sendEmail?: boolean;
      revokeSessions?: boolean;
      reason?: string;
    } = {
      forceResetOnNextLogin: formValue.forceResetOnNextLogin,
      sendEmail: formValue.sendEmail,
      revokeSessions: formValue.revokeSessions,
      reason: formValue.reason || undefined,
    };

    // For manual mode, use the password from the form
    // For auto mode, don't send password so backend generates one
    if (!isAutoGenerate && formValue.password) {
      requestData.password = formValue.password;
    }

    this.userDetailService
      .adminResetPassword(currentUser.id, requestData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.generatedPassword) {
            this.generatedPassword.set(result.generatedPassword);
          }
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.passwordResetSuccess',
            ),
          });
          this.isLoading.set(false);
          // Reset form
          this.resetPasswordForm.reset({
            resetMethod: 'auto',
            forceResetOnNextLogin: false,
            revokeSessions: true,
            sendEmail: true,
            reason: '',
            password: '',
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.passwordResetError',
            ),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Show revoke sessions confirmation dialog
   */
  protected onRevokeSessionsClick(): void {
    this.showRevokeSessionsDialog.set(true);
  }

  /**
   * Confirm and execute session revocation
   */
  protected confirmRevokeSessions(): void {
    this.showRevokeSessionsDialog.set(false);
    this.isLoading.set(true);

    const currentUser = this.user();
    if (!currentUser) return;

    const formValue = this.revokeSessionsForm.value;

    this.userDetailService
      .adminRevokeSessions(currentUser.id, {
        revokeRefreshTokens: formValue.revokeRefreshTokens,
        revokeAllDevices: formValue.revokeAllDevices,
        reason: formValue.reason || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.sessionsRevokedSuccess',
            ),
          });
          this.isLoading.set(false);
          // Reset form
          this.revokeSessionsForm.reset({
            revokeRefreshTokens: true,
            revokeAllDevices: true,
            reason: '',
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.sessionsRevokedError',
            ),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Show block user confirmation dialog
   */
  protected onBlockUserClick(): void {
    this.showBlockUserDialog.set(true);
  }

  /**
   * Confirm and execute user blocking
   */
  protected confirmBlockUser(): void {
    if (this.blockUserForm.invalid) {
      this.blockUserForm.markAllAsTouched();
      return;
    }

    this.showBlockUserDialog.set(false);
    this.isLoading.set(true);

    const currentUser = this.user();
    if (!currentUser) return;

    const formValue = this.blockUserForm.value;

    // Reason is required and validated by form, so we can safely use it
    if (!formValue.reason) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate(
          'userDetail.resetPassword.messages.reasonRequired',
        ),
      });
      this.isLoading.set(false);
      return;
    }

    this.userDetailService
      .adminBlockUser(currentUser.id, {
        reason: formValue.reason,
        softBlock: formValue.softBlock,
        revokeSessions: formValue.revokeSessions,
        sendEmail: formValue.sendEmail,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.userBlockedSuccess',
            ),
          });
          this.isLoading.set(false);
          // Reset form
          this.blockUserForm.reset({
            reason: '',
            softBlock: false,
            revokeSessions: true,
            sendEmail: true,
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.userBlockedError',
            ),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Show unblock user confirmation dialog
   */
  protected onUnblockUserClick(): void {
    this.showUnblockUserDialog.set(true);
  }

  /**
   * Confirm and execute user unblocking
   */
  protected confirmUnblockUser(): void {
    this.showUnblockUserDialog.set(false);
    this.isLoading.set(true);

    const currentUser = this.user();
    if (!currentUser) return;

    const formValue = this.unblockUserForm.value;

    this.userDetailService
      .adminUnblockUser(currentUser.id, {
        reason: formValue.reason || undefined,
        sendEmail: formValue.sendEmail,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.userUnblockedSuccess',
            ),
          });
          this.isLoading.set(false);
          // Reset form
          this.unblockUserForm.reset({
            reason: '',
            sendEmail: true,
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate(
              'userDetail.resetPassword.messages.userUnblockedError',
            ),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Get password strength severity for tag
   */
  protected getPasswordStrengthSeverity(): 'danger' | 'warn' | 'info' | 'success' {
    switch (this.passwordStrength()) {
      case 'weak':
        return 'danger';
      case 'medium':
        return 'warn';
      case 'strong':
        return 'info';
      case 'veryStrong':
        return 'success';
    }
  }

  /**
   * Get password strength label
   */
  protected getPasswordStrengthLabel(): string {
    return this.translocoService.translate(
      `userDetail.resetPassword.resetPasswordSection.password.strength.${this.passwordStrength()}`,
    );
  }
}
