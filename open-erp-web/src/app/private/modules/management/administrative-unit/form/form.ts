import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
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
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

// Core components
import { MapComponent } from '../../../../../../core/components/map/map.component';

// Services and types
import { AdministrativeUnitService } from '../services/administrative-unit.service';
import { AdministrativeUnit, AdminUnitType, AdminUnitFormData } from '../administrative-unit.types';
import { Province } from '../../province/province.types';
import { District } from '../../district/district.types';

@Component({
  selector: 'management-administrative-unit-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    DrawerModule,
    Select,
    TextareaModule,
    MapComponent,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
})
export class AdministrativeUnitForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdministrativeUnitService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  // Signals
  protected readonly visible = signal<boolean>(true);
  protected readonly mode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly unit = signal<AdministrativeUnit | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly provinces = signal<Province[]>([]);
  protected readonly districts = signal<District[]>([]);
  protected readonly parentType = signal<string | null>(null);
  protected readonly parentCode = signal<string | null>(null);

  // Form
  protected form!: FormGroup;

  // Admin unit types
  protected readonly AdminUnitType = AdminUnitType;

  // Computed
  protected readonly title = computed(() => {
    const modeKey = this.mode();
    return this.translocoService.translate(`administrativeUnit.form.title.${modeKey}`);
  });

  protected readonly isViewMode = computed(() => this.mode() === 'view');
  protected readonly geometry = computed(() => {
    const unit = this.unit();
    return unit?.geometry || unit?.geometrySimplified || null;
  });

  ngOnInit(): void {
    // Initialize form
    this.initForm();

    // Determine mode from route
    const path = this.route.snapshot.url.map((s) => s.path).join('/');
    if (path.includes('/new/')) {
      this.mode.set('create');
      this.handleCreateMode();
    } else if (path.includes('/edit')) {
      this.mode.set('edit');
      this.handleEditMode();
    } else if (path.includes('/view')) {
      this.mode.set('view');
      this.handleViewMode();
    }

    // Load provinces for dropdown
    this.loadProvinces();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      nameEn: [''],
      type: [AdminUnitType.PROVINCE, Validators.required],
      provinceCode: [''],
      districtCode: [''],
      region: [''],
      population: [null],
      note: [''],
    });
  }

  private handleCreateMode(): void {
    // Get parent info from route
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const parentType = params.get('parentType');
      const parentCode = params.get('parentCode');

      this.parentType.set(parentType);
      this.parentCode.set(parentCode);

      // Set form defaults based on parent
      if (parentType === 'root') {
        // Creating a province
        this.form.patchValue({ type: AdminUnitType.PROVINCE });
      } else if (parentType === AdminUnitType.PROVINCE) {
        // Creating a district
        this.form.patchValue({
          type: AdminUnitType.DISTRICT,
          provinceCode: parentCode,
        });
      } else if (parentType === AdminUnitType.DISTRICT) {
        // Creating a ward
        this.form.patchValue({
          type: AdminUnitType.WARD,
          districtCode: parentCode,
        });
        // Need to find province code
        // This would require loading the district first
      }
    });
  }

  private handleEditMode(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const unit = data['unit'] as AdministrativeUnit;
      if (unit) {
        this.unit.set(unit);
        this.form.patchValue(unit);
      }
    });
  }

  private handleViewMode(): void {
    this.handleEditMode();
    this.form.disable();
  }

  private loadProvinces(): void {
    this.service
      .getAllProvinces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (provinces) => {
          this.provinces.set(provinces);
        },
        error: (error) => {
          console.error('Error loading provinces:', error);
        },
      });
  }

  protected onProvinceChange(provinceCode: string): void {
    if (provinceCode) {
      this.service
        .getDistrictsByProvinceCode(provinceCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (districts) => {
            this.districts.set(districts);
          },
          error: (error) => {
            console.error('Error loading districts:', error);
          },
        });
    } else {
      this.districts.set([]);
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formData = this.form.value as AdminUnitFormData;

    if (this.mode() === 'create') {
      this.createUnit(formData);
    } else if (this.mode() === 'edit') {
      this.updateUnit(formData);
    }
  }

  private createUnit(data: AdminUnitFormData): void {
    const unit: AdministrativeUnit = {
      ...data,
      id: '', // Will be generated by backend
    } as AdministrativeUnit;

    this.service
      .createUnit(unit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('administrativeUnit.messages.success'),
            detail: this.translocoService.translate('administrativeUnit.messages.createSuccess'),
          });
          this.onClose();
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('administrativeUnit.messages.error'),
            detail: this.translocoService.translate('administrativeUnit.messages.createFailed'),
          });
        },
      });
  }

  private updateUnit(data: AdminUnitFormData): void {
    const currentUnit = this.unit();
    if (!currentUnit) return;

    this.service
      .updateUnit(currentUnit.code, currentUnit.type, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('administrativeUnit.messages.success'),
            detail: this.translocoService.translate('administrativeUnit.messages.updateSuccess'),
          });
          this.onClose();
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('administrativeUnit.messages.error'),
            detail: this.translocoService.translate('administrativeUnit.messages.updateFailed'),
          });
        },
      });
  }

  protected onClose(): void {
    this.visible.set(false);
    // Navigate back to parent list
    setTimeout(() => {
      this.router.navigate(['../../'], { relativeTo: this.route });
    }, 100);
  }
}
