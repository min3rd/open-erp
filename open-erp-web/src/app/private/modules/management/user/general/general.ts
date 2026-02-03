import { ChangeDetectionStrategy, Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

// PrimeNG imports
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services and types
import { UserDetailService, UserDetail } from '../services/user-detail.service';

@Component({
  selector: 'management-user-general',
  imports: [
    CommonModule,
    TranslocoModule,
    SkeletonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './general.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class General implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  protected readonly user = signal<UserDetail | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected editForm!: FormGroup;
  
  // For managing skills and hobbies
  protected newSkill = '';
  protected newHobby = '';
  protected readonly skillsValue = signal<string[]>([]);
  protected readonly hobbiesValue = signal<string[]>([]);
  protected readonly maxEducationEntries = 20;
  protected readonly maxYear = new Date().getFullYear() + 10;
  protected readonly minYear = 1900;
  
  // Dynamic getter for max date to ensure it's always current
  protected get maxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Initialize form
    this.editForm = this.fb.group({
      address: this.fb.group({
        street: [''],
        district: [''],
        city: [''],
        province: [''],
        postalCode: [''],
      }),
      dateOfBirth: [null],
      education: this.fb.array([]),
      skills: [[]],
      hobbies: [[]],
    });

    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        this.user.set(data['userDetail']);
        this.patchFormWithUserData(data['userDetail']);
      }
    });

    // Subscribe to user updates from service
    this.userDetailService.userUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedUser) => {
        if (updatedUser && updatedUser.id === this.user()?.id) {
          this.user.set(updatedUser);
          if (!this.isEditing()) {
            this.patchFormWithUserData(updatedUser);
          }
        }
      });
  }

  private patchFormWithUserData(user: UserDetail): void {
    // Patch address or reset if null
    if (user.address) {
      this.editForm.get('address')?.patchValue(user.address);
    } else {
      this.editForm.get('address')?.patchValue({
        street: '',
        district: '',
        city: '',
        province: '',
        postalCode: '',
      });
    }

    // Patch date of birth or reset if null
    if (user.dateOfBirth) {
      const date = new Date(user.dateOfBirth);
      const dateString = date.toISOString().split('T')[0];
      this.editForm.get('dateOfBirth')?.patchValue(dateString);
    } else {
      this.editForm.get('dateOfBirth')?.patchValue(null);
    }

    // Patch education
    const educationArray = this.editForm.get('education') as FormArray;
    educationArray.clear();
    if (user.education && user.education.length > 0) {
      user.education.forEach((edu) => {
        educationArray.push(
          this.fb.group({
            degree: [edu.degree || ''],
            institution: [edu.institution || ''],
            year: [edu.year || null, [Validators.min(1900), Validators.max(new Date().getFullYear() + 10)]],
          })
        );
      });
    }

    // Patch skills and hobbies
    this.skillsValue.set(user.skills || []);
    this.hobbiesValue.set(user.hobbies || []);
    this.editForm.get('skills')?.patchValue(user.skills || []);
    this.editForm.get('hobbies')?.patchValue(user.hobbies || []);
  }

  protected addSkill(event: Event): void {
    event.preventDefault();
    this.addSkillClick();
  }

  protected addSkillClick(): void {
    if (this.newSkill && this.newSkill.trim()) {
      const skills = [...this.skillsValue()];
      if (skills.length >= 50) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Maximum 50 skills allowed',
        });
        return;
      }
      if (!skills.includes(this.newSkill.trim())) {
        skills.push(this.newSkill.trim());
        this.skillsValue.set(skills);
        this.editForm.get('skills')?.patchValue(skills);
        this.newSkill = '';
      }
    }
  }

  protected removeSkill(skill: string): void {
    const skills = this.skillsValue().filter(s => s !== skill);
    this.skillsValue.set(skills);
    this.editForm.get('skills')?.patchValue(skills);
  }

  protected addHobby(event: Event): void {
    event.preventDefault();
    this.addHobbyClick();
  }

  protected addHobbyClick(): void {
    if (this.newHobby && this.newHobby.trim()) {
      const hobbies = [...this.hobbiesValue()];
      if (hobbies.length >= 50) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Maximum 50 hobbies allowed',
        });
        return;
      }
      if (!hobbies.includes(this.newHobby.trim())) {
        hobbies.push(this.newHobby.trim());
        this.hobbiesValue.set(hobbies);
        this.editForm.get('hobbies')?.patchValue(hobbies);
        this.newHobby = '';
      }
    }
  }

  protected removeHobby(hobby: string): void {
    const hobbies = this.hobbiesValue().filter(h => h !== hobby);
    this.hobbiesValue.set(hobbies);
    this.editForm.get('hobbies')?.patchValue(hobbies);
  }

  protected get educationArray(): FormArray {
    return this.editForm.get('education') as FormArray;
  }

  protected addEducation(): void {
    if (this.educationArray.length >= this.maxEducationEntries) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `Maximum ${this.maxEducationEntries} education entries allowed`,
      });
      return;
    }
    const currentYear = new Date().getFullYear();
    this.educationArray.push(
      this.fb.group({
        degree: [''],
        institution: [''],
        year: [null, [Validators.min(1900), Validators.max(currentYear + 10)]],
      })
    );
  }

  protected removeEducation(index: number): void {
    this.educationArray.removeAt(index);
  }

  protected startEdit(): void {
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
    if (this.user()) {
      this.patchFormWithUserData(this.user()!);
    }
  }

  protected saveChanges(): void {
    if (!this.user() || this.isSaving()) return;

    this.isSaving.set(true);
    const formValue = this.editForm.value;

    // Prepare update payload
    const updateData: Partial<UserDetail> = {};

    // Handle address - send if has data, or explicitly clear if previously had data
    if (formValue.address && this.hasAddressData(formValue.address)) {
      updateData.address = formValue.address;
    } else if (this.user()?.address && !this.hasAddressData(formValue.address)) {
      updateData.address = null as any;
    }

    // Handle date of birth - can be set or cleared
    if (formValue.dateOfBirth !== undefined && formValue.dateOfBirth !== null) {
      updateData.dateOfBirth = formValue.dateOfBirth;
    } else if (this.user()?.dateOfBirth && !formValue.dateOfBirth) {
      // Explicitly clear if it was set before but is now empty
      updateData.dateOfBirth = null as any;
    }

    // Handle education - always send including empty array if cleared
    const filteredEducation = formValue.education ? formValue.education.filter(
      (edu: any) => edu.degree || edu.institution || edu.year
    ) : [];
    if (filteredEducation.length > 0) {
      updateData.education = filteredEducation;
    } else if (this.user()?.education && this.user()!.education!.length > 0) {
      updateData.education = [];
    }

    // Handle skills - always send including empty array if cleared
    const skills = this.skillsValue();
    if (skills.length > 0) {
      updateData.skills = skills;
    } else if (this.user()?.skills && this.user()!.skills!.length > 0) {
      updateData.skills = [];
    }

    // Handle hobbies - always send including empty array if cleared
    const hobbies = this.hobbiesValue();
    if (hobbies.length > 0) {
      updateData.hobbies = hobbies;
    } else if (this.user()?.hobbies && this.user()!.hobbies!.length > 0) {
      updateData.hobbies = [];
    }

    this.userDetailService
      .updateUser(this.user()!.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          // Update user data and re-patch form with the latest data
          this.user.set(updatedUser);
          this.patchFormWithUserData(updatedUser);
          this.isEditing.set(false);
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User profile updated successfully',
          });
        },
        error: (error) => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update user profile',
          });
        },
      });
  }

  private hasAddressData(address: any): boolean {
    return !!(
      address.street ||
      address.district ||
      address.city ||
      address.province ||
      address.postalCode
    );
  }

  protected formatDate(date?: string | Date): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '-';
    }
    return d.toLocaleDateString();
  }

  protected formatAddress(address?: {
    street?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  }): string {
    if (!address) return '-';
    const parts = [
      address.street,
      address.district,
      address.city,
      address.province,
      address.postalCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

