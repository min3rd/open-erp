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
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';

// Core components
import { GeoEditorComponent } from '../../../../../../core/components/geo-editor/geo-editor.component';
import { MapComponent } from '../../../../../../core/components/map/map.component';

// Services and types
import { ProvinceService } from '../services/province.service';
import { Province, CreateProvinceDto, UpdateProvinceDto } from '../province.types';

@Component({
  selector: 'management-province-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    DrawerModule,
    GeoEditorComponent,
    MapComponent,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProvinceForm implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private provinceService = inject(ProvinceService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly provinceId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.provinceId() !== null);
  protected readonly currentGeometry = signal<GeoJSON.Geometry | null>(null);

  // Form
  protected provinceForm!: FormGroup;

  ngOnInit(): void {
    // Initialize form
    this.provinceForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      region: ['', [Validators.required]],
    });

    // Load province data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const province = data['province'] as Province | null;
      if (province) {
        this.provinceId.set(province.id);
        this.provinceForm.patchValue({
          code: province.code,
          name: province.name,
          region: province.region,
        });
        this.currentGeometry.set(province.geometry || null);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle geometry change from GeoEditor
   */
  protected onGeometryChange(geometry: GeoJSON.Geometry | null): void {
    this.currentGeometry.set(geometry);
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (this.provinceForm.invalid) {
      Object.keys(this.provinceForm.controls).forEach((key) => {
        this.provinceForm.controls[key].markAsTouched();
      });
      return;
    }

    this.isSaving.set(true);

    const formData = this.provinceForm.value;
    const geometry = this.currentGeometry();

    if (this.isEditMode()) {
      // Update existing province
      const updateDto: UpdateProvinceDto = {
        code: formData.code,
        name: formData.name,
        region: formData.region,
        geometry: geometry || undefined,
      };

      this.provinceService.updateProvince(this.provinceId()!, updateDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.onClose();
        },
        error: (error) => {
          console.error('Update failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('provinceForm.messages.error'),
            detail: this.translocoService.translate('provinceForm.messages.updateFailed'),
          });
          this.isSaving.set(false);
        },
      });
    } else {
      // Create new province
      const createDto: CreateProvinceDto = {
        code: formData.code,
        name: formData.name,
        region: formData.region,
        geometry: geometry || undefined,
      };

      this.provinceService.createProvince(createDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.onClose();
        },
        error: (error) => {
          console.error('Create failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('provinceForm.messages.error'),
            detail: this.translocoService.translate('provinceForm.messages.createFailed'),
          });
          this.isSaving.set(false);
        },
      });
    }
  }

  /**
   * Close the drawer and navigate back
   */
  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to list

    if (this.provinceId()) {
      this.router.navigate(['../../'], { relativeTo: this.route });
      return;
    }

    this.router.navigate(['../'], { relativeTo: this.route });
  }

  /**
   * Get form control error message
   */
  protected getErrorMessage(controlName: string): string {
    const control = this.provinceForm.get(controlName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return this.translocoService.translate(`provinceForm.fields.${controlName}.errors.required`);
    }
    if (errors['minlength']) {
      return this.translocoService.translate(`provinceForm.fields.${controlName}.errors.minlength`);
    }

    return '';
  }
}
