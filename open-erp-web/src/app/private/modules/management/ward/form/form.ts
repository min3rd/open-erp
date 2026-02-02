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
import { WardService } from '../services/ward.service';
import { Ward, CreateWardDto, UpdateWardDto } from '../ward.types';
import { Province } from '../../province/province.types';
import { District } from '../../district/district.types';

@Component({
  selector: 'management-ward-form',
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
export class WardForm implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private wardService = inject(WardService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly wardCode = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.wardCode() !== null);
  protected readonly currentGeometry = signal<GeoJSON.Geometry | null>(null);
  protected readonly provinces = signal<Province[]>([]);
  protected readonly districts = signal<District[]>([]);
  
  // Computed province and district options
  protected readonly provinceOptions = computed(() => {
    return this.provinces().map(p => ({
      label: p.name,
      value: p.code,
    }));
  });

  protected readonly districtOptions = computed(() => {
    const selectedProvince = this.wardForm?.get('provinceCode')?.value;
    const allDistricts = this.districts();
    
    if (!selectedProvince) {
      return [];
    }
    
    const filteredDistricts = allDistricts.filter(d => d.provinceCode === selectedProvince);
    return filteredDistricts.map(d => ({
      label: d.name,
      value: d.code,
    }));
  });

  // Form
  protected wardForm!: FormGroup;

  ngOnInit(): void {
    // Initialize form
    this.wardForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      nameEn: [''],
      provinceCode: ['', [Validators.required]],
      districtCode: [''], // Not required - supports 2-level government structure
      note: [''],
      isLegacy: [false],
    });

    // Load provinces and districts from resolver (already preloaded by parent route)
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['provinceList']) {
        this.provinces.set(data['provinceList'].items);
      }
      if (data['districtList']) {
        this.districts.set(data['districtList'].items);
      }
    });

    // Watch province changes to reset district
    this.wardForm.get('provinceCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Reset district when province changes
      this.wardForm.patchValue({ districtCode: '' }, { emitEvent: false });
    });

    // Load ward data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const ward = data['ward'] as Ward | null;
      if (ward) {
        this.wardCode.set(ward.code);
        this.wardForm.patchValue({
          code: ward.code,
          name: ward.name,
          nameEn: ward.nameEn || '',
          provinceCode: ward.provinceCode,
          districtCode: ward.districtCode,
          note: ward.note || '',
          isLegacy: ward.isLegacy || false,
        });
        // Set geometry if available, otherwise try centroid (but centroid is just lat/lon, not full geometry)
        if (ward.geometry) {
          this.currentGeometry.set(ward.geometry);
        } else if (ward.centroid) {
          // Convert centroid to GeoJSON Point
          const centroidPoint: GeoJSON.Point = {
            type: 'Point',
            coordinates: [ward.centroid.lon, ward.centroid.lat]
          };
          this.currentGeometry.set(centroidPoint);
        }
      }
    });

    // Check if this is view mode
    const url = this.router.url;
    if (url.includes('/view')) {
      this.wardForm.disable();
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
    if (this.wardForm.invalid) {
      Object.keys(this.wardForm.controls).forEach((key) => {
        this.wardForm.controls[key].markAsTouched();
      });
      return;
    }

    this.isSaving.set(true);

    const formData = this.wardForm.value;
    const geometry = this.currentGeometry();

    // Extract centroid from geometry if it's a Point
    let centroid: { lat: number; lon: number } | undefined;
    if (geometry && geometry.type === 'Point') {
      centroid = {
        lon: (geometry as GeoJSON.Point).coordinates[0],
        lat: (geometry as GeoJSON.Point).coordinates[1]
      };
    }

    if (this.isEditMode()) {
      // Update existing ward
      const updateDto: UpdateWardDto = {
        code: formData.code,
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        provinceCode: formData.provinceCode,
        districtCode: formData.districtCode,
        note: formData.note || undefined,
        isLegacy: formData.isLegacy,
        centroid: centroid,
        geometry: geometry || undefined,
      };

      this.wardService.updateWard(this.wardCode()!, updateDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('wardForm.messages.success'),
            detail: this.translocoService.translate('wardForm.messages.updateSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          console.error('Update failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('wardForm.messages.error'),
            detail: this.translocoService.translate('wardForm.messages.updateFailed'),
          });
          this.isSaving.set(false);
        },
      });
    } else {
      // Create new ward
      const createDto: CreateWardDto = {
        code: formData.code,
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        provinceCode: formData.provinceCode,
        districtCode: formData.districtCode,
        note: formData.note || undefined,
        isLegacy: formData.isLegacy,
        centroid: centroid,
        geometry: geometry || undefined,
      };

      this.wardService.createWard(createDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('wardForm.messages.success'),
            detail: this.translocoService.translate('wardForm.messages.createSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          console.error('Create failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('wardForm.messages.error'),
            detail: this.translocoService.translate('wardForm.messages.createFailed'),
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

    if (this.wardCode()) {
      this.router.navigate(['../../'], { relativeTo: this.route });
      return;
    }

    this.router.navigate(['../'], { relativeTo: this.route });
  }

  /**
   * Get form control error message
   */
  protected getErrorMessage(controlName: string): string {
    const control = this.wardForm.get(controlName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return this.translocoService.translate(`wardForm.fields.${controlName}.errors.required`);
    }
    if (errors['minlength']) {
      return this.translocoService.translate(`wardForm.fields.${controlName}.errors.minlength`);
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
