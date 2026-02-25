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
  FormControl,
  FormArray,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

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

import { MeService } from '../../../../core/services/me-service';
import type { MeProfile, UpdateMeDto } from '../me.types';
import { API_URI_FILE } from '../../../../core/constant';
import { AuthService } from '../../../../core/services/auth-service';
import { UserDatePipe } from '../../../../core/pipes/user-date.pipe';

@Component({
  selector: 'me-profile',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    AvatarModule,
    SkeletonModule,
    TagModule,
    ConfirmDialogModule,
    DividerModule,
    ChipModule,
    UserDatePipe,
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
  private t = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  readonly profile = signal<MeProfile | null>(null);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);

  // New skill/hobby inputs
  newSkill = '';
  newHobby = '';

  editForm!: FormGroup;

  get skillsArray(): FormArray {
    return this.editForm.get('skills') as FormArray;
  }

  get hobbiesArray(): FormArray {
    return this.editForm.get('hobbies') as FormArray;
  }

  ngOnInit(): void {
    this.editForm = this.fb.group({
      fullName: [''],
      displayName: [''],
      phone: [''],
      dateOfBirth: [''],
      skills: this.fb.array([]),
      hobbies: this.fb.array([]),
      country: [''],
      city: [''],
      province: [''],
      district: [''],
      street: [''],
      postalCode: [''],
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
            summary: this.t.translate('common.error'),
            detail: this.t.translate('me.profile.messages.loadError'),
          });
        },
      });
  }

  private patchForm(profile: MeProfile): void {
    // Rebuild skill/hobby arrays
    while (this.skillsArray.length) this.skillsArray.removeAt(0);
    (profile.skills || []).forEach((s) => this.skillsArray.push(new FormControl(s)));
    while (this.hobbiesArray.length) this.hobbiesArray.removeAt(0);
    (profile.hobbies || []).forEach((h) => this.hobbiesArray.push(new FormControl(h)));

    this.editForm.patchValue({
      fullName: profile.fullName || '',
      displayName: profile.displayName || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.substring(0, 10) : '',
      country: profile.address?.country || '',
      city: profile.address?.city || '',
      province: profile.address?.province || '',
      district: profile.address?.district || '',
      street: profile.address?.street || '',
      postalCode: profile.address?.postalCode || '',
    });
  }

  addSkill(): void {
    const skill = this.newSkill.trim();
    if (skill && !this.skillsArray.value.includes(skill)) {
      this.skillsArray.push(new FormControl(skill));
    }
    this.newSkill = '';
  }

  removeSkill(index: number): void {
    this.skillsArray.removeAt(index);
  }

  addHobby(): void {
    const hobby = this.newHobby.trim();
    if (hobby && !this.hobbiesArray.value.includes(hobby)) {
      this.hobbiesArray.push(new FormControl(hobby));
    }
    this.newHobby = '';
  }

  removeHobby(index: number): void {
    this.hobbiesArray.removeAt(index);
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
    const updateData: UpdateMeDto = {
      fullName: formValue.fullName?.trim() || undefined,
      displayName: formValue.displayName?.trim() || undefined,
      phone: formValue.phone?.trim() || undefined,
      dateOfBirth: formValue.dateOfBirth || undefined,
      skills: this.skillsArray.value,
      hobbies: this.hobbiesArray.value,
      address: {
        country: formValue.country?.trim() || undefined,
        city: formValue.city?.trim() || undefined,
        province: formValue.province?.trim() || undefined,
        district: formValue.district?.trim() || undefined,
        street: formValue.street?.trim() || undefined,
        postalCode: formValue.postalCode?.trim() || undefined,
      },
    };

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
            summary: this.t.translate('common.success'),
            detail: this.t.translate('me.profile.messages.updateSuccess'),
          });
        },
        error: (err) => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.t.translate('common.error'),
            detail: err.message || this.t.translate('me.profile.messages.updateError'),
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
        summary: this.t.translate('common.warning'),
        detail: this.t.translate('me.profile.avatar.invalidType'),
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

      // Step 3: Store avatar as MinIO object info { key, bucket }
      // The bucket is included in the presign response
      const bucket = presignData?.data?.bucket;
      this.meService
        .updateProfile({ avatarKey: key, avatarBucket: bucket })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            this.profile.set(updated);
            this.isUploadingAvatar.set(false);
            this.messageService.add({
              severity: 'success',
              summary: this.t.translate('common.success'),
              detail: this.t.translate('me.profile.avatar.uploadSuccess'),
            });
          },
          error: (err) => {
            this.isUploadingAvatar.set(false);
            this.messageService.add({
              severity: 'error',
              summary: this.t.translate('common.error'),
              detail: err.message || this.t.translate('me.profile.avatar.uploadError'),
            });
          },
        });
    } catch (err: any) {
      this.isUploadingAvatar.set(false);
      this.messageService.add({
        severity: 'error',
        summary: this.t.translate('common.error'),
        detail: err.message || this.t.translate('me.profile.avatar.uploadError'),
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
