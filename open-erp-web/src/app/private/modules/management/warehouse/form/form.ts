import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
  isDevMode,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DrawerModule } from 'primeng/drawer';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';

// Core components
import { MapComponent } from '../../../../../../core/components/map/map.component';

// Core services
import {
  GeocodingService,
  GeocodingResult,
} from '../../../../../../core/services/geocoding.service';
import { WarehouseService } from '../../../../../../core/services/warehouse/warehouse.service';
import type {
  ProvinceDto,
  WardDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  Warehouse as WarehouseResponse,
} from '../../../../../../core/services/warehouse/warehouse.service';

// Types
import {
  Warehouse,
  WarehouseType,
  WarehouseStatus,
  CapacityUnit,
  SecurityLevel,
  WorkingShift,
  Currency,
  PaymentTerm,
} from '../warehouse.types';

@Component({
  selector: 'management-warehouse-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DrawerModule,
    AutoCompleteModule,
    Select,
    InputNumberModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    MapComponent,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseForm implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly warehouseService = inject(WarehouseService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);
  private readonly geocodingService = inject(GeocodingService);

  protected readonly warehouse = signal<WarehouseResponse | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly isViewMode = signal(false);
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isDevEnv = isDevMode();
  protected readonly currentGeometry = signal<GeoJSON.Geometry | null>(null);

  // Location search
  protected readonly locationSuggestions = signal<GeocodingResult[]>([]);
  protected readonly isSearchingLocation = signal(false);

  // Province and Ward dropdowns
  protected readonly provinces = signal<ProvinceDto[]>([]);
  protected readonly wards = signal<WardDto[]>([]);
  protected readonly isLoadingWards = signal(false);

  // Warehouse type options (from enum)
  protected readonly warehouseTypeOptions = Object.values(WarehouseType).map((type) => ({
    label: this.formatEnumLabel(type),
    value: type,
  }));

  // Status options (from enum)
  protected readonly statusOptions = Object.values(WarehouseStatus).map((status) => ({
    label: this.formatEnumLabel(status),
    value: status,
  }));

  // Capacity unit options
  protected readonly capacityUnitOptions = Object.values(CapacityUnit).map((unit) => ({
    label: unit,
    value: unit,
  }));

  // Security level options
  protected readonly securityLevelOptions = Object.values(SecurityLevel).map((level) => ({
    label: this.formatEnumLabel(level),
    value: level,
  }));

  // Working shift options
  protected readonly workingShiftOptions = Object.values(WorkingShift).map((shift) => ({
    label: shift === '24/7' ? '24/7' : this.formatEnumLabel(shift),
    value: shift,
  }));

  // Currency options
  protected readonly currencyOptions = Object.values(Currency).map((currency) => ({
    label: currency,
    value: currency,
  }));

  // Payment term options
  protected readonly paymentTermOptions = Object.values(PaymentTerm).map((term) => ({
    label: this.formatEnumLabel(term),
    value: term,
  }));

  protected form!: FormGroup;

  // Computed geometry for map preview
  protected readonly mapGeometry = computed(() => this.currentGeometry());

  ngOnInit(): void {
    // Initialize form with all fields
    this.form = this.fb.group({
      // Required fields
      code: ['', Validators.required],
      name: ['', Validators.required],
      type: [null, Validators.required],
      addressDetail: ['', Validators.required],
      provinceCode: [null, Validators.required],
      wardCode: [null, Validators.required],

      // Status defaults to active
      status: [WarehouseStatus.ACTIVE],

      // Location fields
      latitude: [null],
      longitude: [null],

      // Capacity fields
      totalAreaM2: [null],
      usableAreaM2: [null],
      storageCapacity: [null],
      capacityUnit: [null],
      zonesCount: [null],
      racksCount: [null],
      floorsCount: [null],

      // Storage conditions
      temperatureMin: [null],
      temperatureMax: [null],
      humidityMin: [null],
      humidityMax: [null],

      // Operations
      managerName: [''],
      contactPhone: [''],
      contactEmail: [''],
      workersCount: [null],
      workingShift: [null],
      operatingHours: [''],

      // Security
      securityLevel: [null],
      fireProtectionCert: [''],

      // Finance
      storageFee: [null],
      handlingFee: [null],
      currency: [null],
      paymentTerm: [null],
    });

    // Get provinces from resolver
    this.route.data.subscribe((data) => {
      const provinces = data['provinces'] as ProvinceDto[];
      if (provinces) {
        this.provinces.set(provinces);
      }
    });

    // Watch province changes to load wards
    this.form.get('provinceCode')?.valueChanges.subscribe((provinceCode) => {
      if (provinceCode) {
        this.loadWards(provinceCode);
      } else {
        this.wards.set([]);
        this.form.patchValue({ wardCode: null });
      }
    });

    // Determine mode from route
    const routePath = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.isViewMode.set(routePath === 'view');
    this.isEditMode.set(routePath === 'edit');

    // Check for location from query params (from map context menu)
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['lat'] && queryParams['lng']) {
      const lat = parseFloat(queryParams['lat']);
      const lng = parseFloat(queryParams['lng']);

      if (!isNaN(lat) && !isNaN(lng)) {
        this.form.patchValue({
          latitude: lat,
          longitude: lng,
        });

        // Create Point geometry
        const pointGeometry: GeoJSON.Point = {
          type: 'Point',
          coordinates: [lng, lat],
        };
        this.currentGeometry.set(pointGeometry);
      }
    }

    // Load warehouse data if available
    this.route.data.subscribe((data) => {
      const warehouse = data['warehouse'] as WarehouseResponse;
      if (warehouse) {
        this.warehouse.set(warehouse);

        // Populate form from warehouse data
        this.form.patchValue({
          code: warehouse.code,
          name: warehouse.name,
          type: warehouse.type,
          addressDetail: warehouse.addressDetail,
          provinceCode: warehouse.province?.code,
          wardCode: warehouse.ward?.code,
          status: warehouse.status,
          totalAreaM2: warehouse.totalAreaM2,
          usableAreaM2: warehouse.usableAreaM2,
          storageCapacity: warehouse.storageCapacity,
          capacityUnit: warehouse.capacityUnit,
          zonesCount: warehouse.zonesCount,
          racksCount: warehouse.racksCount,
          floorsCount: warehouse.floorsCount,
          temperatureMin: warehouse.temperatureMin,
          temperatureMax: warehouse.temperatureMax,
          humidityMin: warehouse.humidityMin,
          humidityMax: warehouse.humidityMax,
          managerName: warehouse.manager?.name,
          contactPhone: warehouse.contactPhone,
          contactEmail: warehouse.contactEmail,
          workersCount: warehouse.workersCount,
          workingShift: warehouse.workingShift,
          operatingHours: warehouse.operatingHours,
          securityLevel: warehouse.securityLevel,
          fireProtectionCert: warehouse.fireProtectionCert,
          storageFee: warehouse.storageFee,
          handlingFee: warehouse.handlingFee,
          currency: warehouse.currency,
          paymentTerm: warehouse.paymentTerm,
        });

        // Load geometry if available
        if (warehouse.location) {
          const pointGeometry: GeoJSON.Point = {
            type: 'Point',
            coordinates: warehouse.location.coordinates,
          };
          this.currentGeometry.set(pointGeometry);

          // Extract lat/lng from coordinates
          this.form.patchValue({
            longitude: warehouse.location.coordinates[0],
            latitude: warehouse.location.coordinates[1],
          });
        }

        if (this.isViewMode()) {
          this.form.disable();
        }
      }
    });
  }

  /**
   * Format enum value for display (e.g., "cold_storage" -> "Cold Storage")
   */
  private formatEnumLabel(value: string): string {
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Load provinces from API
   */
  /**
   * Load wards by province code from API
   */
  private loadWards(provinceCode: string): void {
    this.isLoadingWards.set(true);
    this.warehouseService.getWardsByProvince(provinceCode).subscribe({
      next: (wards) => {
        this.wards.set(wards);
        this.isLoadingWards.set(false);
      },
      error: (error) => {
        console.error('Failed to load wards:', error);
        this.isLoadingWards.set(false);
      },
    });
  }

  /**
   * Handle geometry change from geo editor
   */
  protected onGeometryChange(geometry: GeoJSON.Geometry | null): void {
    this.currentGeometry.set(geometry);

    // Extract lat/lng from point geometry
    if (geometry?.type === 'Point' && Array.isArray(geometry.coordinates)) {
      this.form.patchValue({
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
      });
    }
  }

  /**
   * Handle map click to pick a point location
   */
  protected onMapClick(event: { lat: number; lng: number }): void {
    this.form.patchValue({
      latitude: event.lat,
      longitude: event.lng,
    });

    const pointGeometry: GeoJSON.Point = {
      type: 'Point',
      coordinates: [event.lng, event.lat],
    };
    this.currentGeometry.set(pointGeometry);
  }

  /**
   * Search for locations using Nominatim API
   */
  protected searchLocation(event: { query: string }): void {
    const query = event.query;
    if (!query || query.length < 3) {
      this.locationSuggestions.set([]);
      return;
    }

    this.isSearchingLocation.set(true);
    this.geocodingService.searchLocation(query, 10).subscribe({
      next: (results) => {
        this.locationSuggestions.set(results);
        this.isSearchingLocation.set(false);
      },
      error: (error) => {
        console.error('Location search failed:', error);
        this.locationSuggestions.set([]);
        this.isSearchingLocation.set(false);
      },
    });
  }

  /**
   * Handle location selection from Nominatim autocomplete
   */
  protected onLocationSelect(event: any): void {
    const result = event.value as GeocodingResult;
    if (!result) return;

    // Update address field with full address
    this.form.patchValue({
      addressDetail: result.display_name,
    });

    // Update coordinates
    const coords = this.geocodingService.getCoordinates(result);
    this.form.patchValue({
      latitude: coords.lat,
      longitude: coords.lng,
    });

    // Create Point geometry
    const pointGeometry: GeoJSON.Point = {
      type: 'Point',
      coordinates: [coords.lng, coords.lat],
    };
    this.currentGeometry.set(pointGeometry);
  }

  protected onSave(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('warehouseForm.messages.error'),
        detail: this.translocoService.translate('warehouseForm.messages.validationFailed'),
      });
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    // Get selected province and ward
    const selectedProvince = this.provinces().find((p) => p.code === formValue.provinceCode);
    const selectedWard = this.wards().find((w) => w.code === formValue.wardCode);

    if (!selectedProvince || !selectedWard) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('warehouseForm.messages.error'),
        detail: this.translocoService.translate('warehouseForm.messages.invalidLocation'),
      });
      this.isLoading.set(false);
      return;
    }

    // Build DTO matching backend expectations
    const dto: CreateWarehouseDto | UpdateWarehouseDto = {
      code: formValue.code,
      name: formValue.name,
      type: formValue.type,
      status: formValue.status,
      addressDetail: formValue.addressDetail,
      province: {
        code: selectedProvince.code,
        name: selectedProvince.name,
      },
      ward: {
        code: selectedWard.code,
        name: selectedWard.name,
      },
    };

    // Add location if coordinates are available
    if (formValue.latitude && formValue.longitude) {
      dto.location = {
        type: 'Point',
        coordinates: [formValue.longitude, formValue.latitude],
      };
    }

    // Add optional capacity fields
    if (formValue.totalAreaM2) dto.totalAreaM2 = formValue.totalAreaM2;
    if (formValue.usableAreaM2) dto.usableAreaM2 = formValue.usableAreaM2;
    if (formValue.storageCapacity) dto.storageCapacity = formValue.storageCapacity;
    if (formValue.capacityUnit) dto.capacityUnit = formValue.capacityUnit;
    if (formValue.zonesCount) dto.zonesCount = formValue.zonesCount;
    if (formValue.racksCount) dto.racksCount = formValue.racksCount;
    if (formValue.floorsCount) dto.floorsCount = formValue.floorsCount;

    // Add optional storage condition fields
    if (formValue.temperatureMin !== null) dto.temperatureMin = formValue.temperatureMin;
    if (formValue.temperatureMax !== null) dto.temperatureMax = formValue.temperatureMax;
    if (formValue.humidityMin !== null) dto.humidityMin = formValue.humidityMin;
    if (formValue.humidityMax !== null) dto.humidityMax = formValue.humidityMax;

    // Add optional operations fields
    if (formValue.managerName) {
      dto.manager = { name: formValue.managerName };
    }
    if (formValue.contactPhone) dto.contactPhone = formValue.contactPhone;
    if (formValue.contactEmail) dto.contactEmail = formValue.contactEmail;
    if (formValue.workersCount) dto.workersCount = formValue.workersCount;
    if (formValue.workingShift) dto.workingShift = formValue.workingShift;
    if (formValue.operatingHours) dto.operatingHours = formValue.operatingHours;

    // Add optional security fields
    if (formValue.securityLevel) dto.securityLevel = formValue.securityLevel;
    if (formValue.fireProtectionCert) dto.fireProtectionCert = formValue.fireProtectionCert;

    // Add optional finance fields
    if (formValue.storageFee) dto.storageFee = formValue.storageFee;
    if (formValue.handlingFee) dto.handlingFee = formValue.handlingFee;
    if (formValue.currency) dto.currency = formValue.currency;
    if (formValue.paymentTerm) dto.paymentTerm = formValue.paymentTerm;

    const saveOperation = this.warehouse()
      ? this.warehouseService.updateWarehouse(this.warehouse()!.id, dto)
      : this.warehouseService.createWarehouse(dto as CreateWarehouseDto);

    saveOperation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('warehouseForm.messages.success'),
          detail: this.translocoService.translate(
            this.warehouse()
              ? 'warehouseForm.messages.updateSuccess'
              : 'warehouseForm.messages.createSuccess',
          ),
        });
        this.onClose();
      },
      error: (error) => {
        console.error('Save failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('warehouseForm.messages.error'),
          detail:
            error?.error?.message ||
            this.translocoService.translate('warehouseForm.messages.saveFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected randomizeData(): void {
    const timeStr = new Date().getTime().toString().slice(-6);
    const randomItem = <T>(arr: T[]): T | null =>
      arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

    this.form.patchValue({
      code: `TEST-WH-${timeStr}`,
      name: `Test Warehouse ${timeStr}`,
      type: randomItem(this.warehouseTypeOptions)?.value,
      addressDetail: `Test Address ${timeStr}, Random Street`,
      status: WarehouseStatus.ACTIVE,
      latitude: 21.028511 + (Math.random() - 0.5) * 0.1,
      longitude: 105.804817 + (Math.random() - 0.5) * 0.1,
      totalAreaM2: Math.floor(Math.random() * 5000) + 1000,
      usableAreaM2: Math.floor(Math.random() * 4000) + 800,
      storageCapacity: Math.floor(Math.random() * 10000) + 2000,
      capacityUnit: randomItem(this.capacityUnitOptions)?.value,
      zonesCount: Math.floor(Math.random() * 10) + 1,
      racksCount: Math.floor(Math.random() * 50) + 10,
      floorsCount: Math.floor(Math.random() * 3) + 1,
      temperatureMin: 15,
      temperatureMax: 25,
      humidityMin: 40,
      humidityMax: 60,
      managerName: `Test Manager ${timeStr}`,
      contactPhone:
        '09' +
        Math.floor(Math.random() * 100000000)
          .toString()
          .padStart(8, '0'),
      contactEmail: `test.manager.${timeStr}@example.com`,
      workersCount: Math.floor(Math.random() * 50) + 5,
      workingShift: randomItem(this.workingShiftOptions)?.value,
      operatingHours: '08:00 - 17:00 (Test)',
      securityLevel: randomItem(this.securityLevelOptions)?.value,
      fireProtectionCert: `TEST-FIRE-CERT-${timeStr}`,
      storageFee: Math.floor(Math.random() * 500) + 50,
      handlingFee: Math.floor(Math.random() * 200) + 20,
      currency: randomItem(this.currencyOptions)?.value,
      paymentTerm: randomItem(this.paymentTermOptions)?.value,
    });

    // Simulate province change
    if (this.provinces().length > 0) {
      const pCode = randomItem(this.provinces())?.code;
      if (pCode) {
        this.form.get('provinceCode')?.setValue(pCode);

        // Let user select ward manually or we can try adding a timeout check
        setTimeout(() => {
          if (this.wards().length > 0) {
            this.form.get('wardCode')?.setValue(randomItem(this.wards())?.code);
          }
        }, 500);
      }
    }
  }

  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to list - use relative navigation to parent
    if (this.warehouse()) {
      // For edit/view mode: go up 3 levels (../../../)
      this.router.navigate(['../../..'], { relativeTo: this.route });
    } else {
      // For new mode: go up 1 level (../)
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  protected onViewStructure(): void {
    const id = this.warehouse()?.id;
    if (id) {
      this.router.navigate(['../structure'], { relativeTo: this.route });
    }
  }
}
