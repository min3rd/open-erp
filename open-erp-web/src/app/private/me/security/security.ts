import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { MeService } from '../../../../core/services/me-service';
import type { MeSession, TwoFAStatus, TwoFAPrepareResult } from '../me.types';
import { UserDatePipe } from '../../../../core/pipes/user-date.pipe';

function passwordMatchValidator(group: AbstractControl) {
  const newPass = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return newPass && confirm && newPass !== confirm
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'me-security',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    SkeletonModule,
    ConfirmDialogModule,
    TableModule,
    TagModule,
    DividerModule,
    DialogModule,
    UserDatePipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './security.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeSecurityComponent implements OnInit, OnDestroy {
  private meService = inject(MeService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();

  readonly sessions = signal<MeSession[]>([]);
  readonly isLoadingSessions = signal(true);
  readonly isChangingPassword = signal(false);
  readonly revokingSessionId = signal<string | null>(null);

  // 2FA state
  readonly twoFAStatus = signal<TwoFAStatus | null>(null);
  readonly isLoading2FA = signal(false);
  readonly show2FASetupDialog = signal(false);
  readonly show2FADisableDialog = signal(false);
  readonly showRecoveryCodesDialog = signal(false);
  readonly twoFAPrepareData = signal<TwoFAPrepareResult | null>(null);
  readonly recoveryCodes = signal<string[]>([]);
  readonly isPreparing2FA = signal(false);
  readonly isEnabling2FA = signal(false);
  readonly isDisabling2FA = signal(false);
  readonly enableOtp = signal('');
  readonly disableOtp = signal('');
  readonly secretCopied = signal(false);
  readonly recoveryCodesCopied = signal(false);

  changePasswordForm!: FormGroup;

  ngOnInit(): void {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator },
    );

    this.loadSessions();
    this.load2FAStatus();
  }

  private loadSessions(): void {
    this.isLoadingSessions.set(true);
    this.meService
      .getSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.isLoadingSessions.set(false);
        },
        error: () => {
          this.isLoadingSessions.set(false);
        },
      });
  }

  private load2FAStatus(): void {
    this.isLoading2FA.set(true);
    this.meService
      .get2FAStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.twoFAStatus.set(status);
          this.isLoading2FA.set(false);
        },
        error: () => {
          this.isLoading2FA.set(false);
        },
      });
  }

  submitChangePassword(): void {
    if (this.changePasswordForm.invalid || this.isChangingPassword()) return;

    this.isChangingPassword.set(true);
    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.meService
      .changePassword({ currentPassword, newPassword })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isChangingPassword.set(false);
          this.changePasswordForm.reset();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Mật khẩu đã được thay đổi',
          });
        },
        error: (err) => {
          this.isChangingPassword.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Không thể thay đổi mật khẩu',
          });
        },
      });
  }

  confirmRevokeSession(session: MeSession): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn đăng xuất thiết bị "${session.deviceInfo}"?`,
      header: 'Xác nhận đăng xuất',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đăng xuất',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.revokeSession(session.id),
    });
  }

  private revokeSession(sessionId: string): void {
    this.revokingSessionId.set(sessionId);
    this.meService
      .revokeSession(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.revokingSessionId.set(null);
          this.sessions.set(this.sessions().filter((s) => s.id !== sessionId));
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Phiên đã được thu hồi',
          });
        },
        error: (err) => {
          this.revokingSessionId.set(null);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Không thể thu hồi phiên',
          });
        },
      });
  }

  // ─── 2FA methods ──────────────────────────────────────────────────────────

  openEnable2FADialog(): void {
    this.enableOtp.set('');
    this.twoFAPrepareData.set(null);
    this.secretCopied.set(false);
    this.show2FASetupDialog.set(true);
    this.startPrepare2FA();
  }

  private startPrepare2FA(): void {
    this.isPreparing2FA.set(true);
    this.meService
      .prepare2FA()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.twoFAPrepareData.set(data);
          this.isPreparing2FA.set(false);
        },
        error: (err) => {
          this.isPreparing2FA.set(false);
          this.show2FASetupDialog.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Không thể khởi tạo 2FA',
          });
        },
      });
  }

  submitEnable2FA(): void {
    const otp = this.enableOtp().trim();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Chú ý',
        detail: 'Mã OTP phải gồm 6 chữ số',
      });
      return;
    }

    this.isEnabling2FA.set(true);
    this.meService
      .enable2FA(otp)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isEnabling2FA.set(false);
          this.show2FASetupDialog.set(false);
          this.recoveryCodes.set(result.recoveryCodes);
          this.recoveryCodesCopied.set(false);
          this.showRecoveryCodesDialog.set(true);
          this.twoFAStatus.set({ enabled: true, hasRecoveryCodes: true });
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: '2FA đã được bật',
          });
        },
        error: (err) => {
          this.isEnabling2FA.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn',
          });
        },
      });
  }

  openDisable2FADialog(): void {
    this.disableOtp.set('');
    this.show2FADisableDialog.set(true);
  }

  submitDisable2FA(): void {
    const otp = this.disableOtp().trim();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Chú ý',
        detail: 'Mã OTP phải gồm 6 chữ số',
      });
      return;
    }

    this.isDisabling2FA.set(true);
    this.meService
      .disable2FA(otp)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDisabling2FA.set(false);
          this.show2FADisableDialog.set(false);
          this.twoFAStatus.set({ enabled: false, hasRecoveryCodes: false });
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: '2FA đã được tắt',
          });
        },
        error: (err) => {
          this.isDisabling2FA.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Mã OTP không hợp lệ',
          });
        },
      });
  }

  copySecret(): void {
    const data = this.twoFAPrepareData();
    if (data?.secret) {
      navigator.clipboard.writeText(data.secret).then(() => {
        this.secretCopied.set(true);
        setTimeout(() => this.secretCopied.set(false), 2000);
      });
    }
  }

  copyRecoveryCodes(): void {
    const codes = this.recoveryCodes().join('\n');
    navigator.clipboard.writeText(codes).then(() => {
      this.recoveryCodesCopied.set(true);
      setTimeout(() => this.recoveryCodesCopied.set(false), 2000);
    });
  }

  downloadRecoveryCodes(): void {
    const codes = this.recoveryCodes().join('\n');
    const blob = new Blob([`OpenERP Recovery Codes\n\n${codes}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openerp-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  getPasswordStrengthLabel(password: string): { label: string; class: string } {
    if (!password) return { label: '', class: '' };
    const strength = this.calculateStrength(password);
    if (strength < 2) return { label: 'Yếu', class: 'text-red-500' };
    if (strength < 3) return { label: 'Trung bình', class: 'text-orange-500' };
    if (strength < 4) return { label: 'Khá', class: 'text-yellow-500' };
    return { label: 'Mạnh', class: 'text-green-500' };
  }

  private calculateStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) score++;
    return score;
  }

  formatDate(date?: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('vi-VN');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
