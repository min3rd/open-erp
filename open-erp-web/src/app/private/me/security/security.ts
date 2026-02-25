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
import { MessageService, ConfirmationService } from 'primeng/api';

import { MeService } from '../../../../core/services/me-service';
import type { MeSession } from '../me.types';

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
