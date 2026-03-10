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
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';

// Core components
import { GeoEditorComponent } from '../../../../../../core/components/geo-editor/geo-editor.component';
import { MapComponent } from '../../../../../../core/components/map/map.component';

// Services and types
import { DistrictService } from '../services/district.service';
import { ProvinceService } from '../../province/services/province.service';
import { District, CreateDistrictDto, UpdateDistrictDto } from '../district.types';
import { Province } from '../../province/province.types';

@Component({
  selector: 'management-district-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    DrawerModule,
    Select,
    TextareaModule,
    ToggleButtonModule,
    GeoEditorComponent,
    MapComponent,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistrictForm implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private districtService = inject(DistrictService);
  private provinceService = inject(ProvinceService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly districtCode = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.districtCode() !== null);
  protected readonly currentGeometry = signal<GeoJSON.Geometry | null>(null);
  protected readonly provinces = signal<Province[]>([]);

  // Computed province options
  protected readonly provinceOptions = computed(() => {
    return this.provinces().map((p) => ({
      label: p.name,
      value: p.code,
    }));
  });

  // Form
  protected districtForm!: FormGroup;

  ngOnInit(): void {
    // Initialize form
    this.districtForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      nameEn: [''],
      provinceCode: ['', [Validators.required]],
      isLegacy: [false],
    });

    // Load provinces for dropdown
    this.provinceService.getProvinces({ page: 1, limit: 1000 }).subscribe({
      next: (data) => {
        this.provinces.set(data.items);
      },
      error: (error) => {
        console.error('Failed to load provinces:', error);
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('districtForm.messages.error'),
          detail: this.translocoService.translate('districtForm.messages.provinceLoadFailed'),
        });
      },
    });

    // Load district data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const district = data['district'] as District | null;
      if (district) {
        this.districtCode.set(district.code);
        this.districtForm.patchValue({
          code: district.code,
          name: district.name,
          nameEn: district.nameEn || '',
          provinceCode: district.provinceCode,
          isLegacy: district.isLegacy || false,
        });
        // Set geometry if available, otherwise try centroid (but centroid is just lat/lon, not full geometry)
        if (district.geometry) {
          this.currentGeometry.set(district.geometry);
        } else if (district.centroid) {
          // Convert centroid to GeoJSON Point
          const centroidPoint: GeoJSON.Point = {
            type: 'Point',
            coordinates: [district.centroid.lon, district.centroid.lat],
          };
          this.currentGeometry.set(centroidPoint);
        }
      }
    });

    // Check if this is view mode
    const url = this.router.url;
    if (url.includes('/view')) {
      this.districtForm.disable();
    }
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
    if (this.districtForm.invalid) {
      Object.keys(this.districtForm.controls).forEach((key) => {
        this.districtForm.controls[key].markAsTouched();
      });
      return;
    }

    this.isSaving.set(true);

    const formData = this.districtForm.value;
    const geometry = this.currentGeometry();

    // Extract centroid from geometry if it's a Point
    let centroid: { lat: number; lon: number } | undefined;
    if (geometry && geometry.type === 'Point') {
      centroid = {
        lon: (geometry as GeoJSON.Point).coordinates[0],
        lat: (geometry as GeoJSON.Point).coordinates[1],
      };
    }

    if (this.isEditMode()) {
      // Update existing district
      const updateDto: UpdateDistrictDto = {
        code: formData.code,
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        provinceCode: formData.provinceCode,
        isLegacy: formData.isLegacy,
        centroid: centroid,
        geometry: geometry || undefined,
      };

      this.districtService.updateDistrict(this.districtCode()!, updateDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('districtForm.messages.success'),
            detail: this.translocoService.translate('districtForm.messages.updateSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          console.error('Update failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('districtForm.messages.error'),
            detail: this.translocoService.translate('districtForm.messages.updateFailed'),
          });
          this.isSaving.set(false);
        },
      });
    } else {
      // Create new district
      const createDto: CreateDistrictDto = {
        code: formData.code,
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        provinceCode: formData.provinceCode,
        isLegacy: formData.isLegacy,
        centroid: centroid,
        geometry: geometry || undefined,
      };

      this.districtService.createDistrict(createDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('districtForm.messages.success'),
            detail: this.translocoService.translate('districtForm.messages.createSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          console.error('Create failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('districtForm.messages.error'),
            detail: this.translocoService.translate('districtForm.messages.createFailed'),
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

    if (this.districtCode()) {
      this.router.navigate(['../../'], { relativeTo: this.route });
      return;
    }

    this.router.navigate(['../'], { relativeTo: this.route });
  }

  /**
   * Get form control error message
   */
  protected getErrorMessage(controlName: string): string {
    const control = this.districtForm.get(controlName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return this.translocoService.translate(`districtForm.fields.${controlName}.errors.required`);
    }
    if (errors['minlength']) {
      return this.translocoService.translate(`districtForm.fields.${controlName}.errors.minlength`);
    }

    return '';
  }

  /**
   * Get whether form is in view-only mode
   */
  protected isViewMode(): boolean {
    return this.router.url.includes('/view');
  }
}
