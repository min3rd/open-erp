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
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

import { MeService, MeProfile, UpdateMeDto } from '../../../../core/services/me-service';
import { API_URI_FILE } from '../../../../core/constant';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'me-profile',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    AvatarModule,
    SkeletonModule,
    TagModule,
    ConfirmDialogModule,
    DividerModule,
    ChipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeProfileComponent implements OnInit, OnDestroy {
  private meService = inject(MeService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  readonly profile = signal<MeProfile | null>(null);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);

  editForm!: FormGroup;

  ngOnInit(): void {
    this.editForm = this.fb.group({
      fullName: [''],
      displayName: [''],
      phone: [''],
    });

    this.meService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.patchForm(profile);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải thông tin hồ sơ',
          });
        },
      });
  }

  private patchForm(profile: MeProfile): void {
    this.editForm.patchValue({
      fullName: profile.fullName || '',
      displayName: profile.displayName || '',
      phone: profile.phone || '',
    });
  }

  startEdit(): void {
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    if (this.profile()) {
      this.patchForm(this.profile()!);
    }
  }

  saveChanges(): void {
    if (this.isSaving()) return;
    this.isSaving.set(true);

    const formValue = this.editForm.value;
    const updateData: UpdateMeDto = {};

    if (formValue.fullName?.trim()) updateData.fullName = formValue.fullName.trim();
    if (formValue.displayName?.trim()) updateData.displayName = formValue.displayName.trim();
    if (formValue.phone?.trim()) updateData.phone = formValue.phone.trim();

    this.meService
      .updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.isEditing.set(false);
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Hồ sơ đã được cập nhật',
          });
        },
        error: (err) => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Không thể cập nhật hồ sơ',
          });
        },
      });
  }

  async onAvatarFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Chỉ cho phép ảnh JPG, PNG, GIF, WEBP',
      });
      return;
    }

    this.isUploadingAvatar.set(true);

    try {
      const accessToken = this.authService.accessToken;
      const key = `avatars/${Date.now()}-${file.name}`;

      // Step 1: Get presigned upload URL from file service
      const presignResp = await fetch(
        `${API_URI_FILE}/v1/presign/upload?key=${encodeURIComponent(key)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!presignResp.ok) throw new Error('Could not get upload URL');
      const presignData = await presignResp.json();
      const uploadUrl: string = presignData?.data?.uploadUrl || presignData?.uploadUrl;
      if (!uploadUrl) throw new Error('Invalid presign response');

      // Step 2: Upload file directly to MinIO via presigned URL
      const uploadResp = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadResp.ok) throw new Error('Upload failed');

      // Step 3: Derive public URL and update profile
      const publicUrl = uploadUrl.split('?')[0];

      this.meService
        .updateProfile({ avatarUrl: publicUrl })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            this.profile.set(updated);
            this.isUploadingAvatar.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Ảnh đại diện đã được cập nhật',
            });
          },
          error: (err) => {
            this.isUploadingAvatar.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: err.message || 'Không thể cập nhật ảnh đại diện',
            });
          },
        });
    } catch (err: any) {
      this.isUploadingAvatar.set(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: err.message || 'Tải ảnh lên thất bại',
      });
    }
  }

  formatDate(date?: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
