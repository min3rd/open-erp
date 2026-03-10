import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DrawerModule } from 'primeng/drawer';
import { Subject, takeUntil } from 'rxjs';
import {
  WarehouseService,
  Warehouse,
  QuickCreateWarehouseDto,
} from '../../../../../../core/services/warehouse/warehouse.service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { slugify } from '../../../../../../core/utils/slugify';
import { isDev } from '../../../../../../core/utils/env.util';

@Component({
  selector: 'app-quick-warehouse-drawer',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    DrawerModule,
  ],
  templateUrl: './quick-warehouse-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickWarehouseDrawer implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly warehouseService = inject(WarehouseService);
  private readonly orgContextService = inject(OrganizationContextService);
  private readonly destroy$ = new Subject<void>();

  /** Controls visibility of the drawer. Two-way bindable. */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Emitted when a warehouse has been successfully created. */
  @Output() warehouseCreated = new EventEmitter<Warehouse>();

  protected readonly saving = signal(false);
  protected readonly isDevEnv = isDev;
  protected readonly isMobile = signal(
    typeof window !== 'undefined' && window.innerWidth < 768,
  );
  protected readonly drawerStyle = computed(() => ({
    width: this.isMobile() ? '100vw' : '480px',
  }));

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    code: ['', [Validators.maxLength(50)]],
    addressDetail: ['', [Validators.maxLength(500)]],
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onHide(): void {
    this.close();
  }

  protected close(): void {
    this.form.reset();
    this.saving.set(false);
    this.visibleChange.emit(false);
  }

  /** Auto-derive code from the name field when the user has not manually typed a code. */
  protected onNameInput(): void {
    const nameVal: string = this.form.get('name')?.value ?? '';
    const codeCtrl = this.form.get('code');
    if (!codeCtrl?.dirty) {
      const generated = slugify(nameVal, 20).toUpperCase().replace(/-/g, '_');
      codeCtrl?.setValue(generated, { emitEvent: false });
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const org = this.orgContextService.currentOrganization();

    const dto: QuickCreateWarehouseDto = {
      name: raw.name ?? '',
      ...(raw.code?.trim() ? { code: raw.code.trim() } : {}),
      ...(raw.addressDetail?.trim() ? { addressDetail: raw.addressDetail.trim() } : {}),
      ...(org?.id ? { tenantId: org.id } : {}),
    };

    this.warehouseService
      .quickCreateWarehouse(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (warehouse) => {
          this.saving.set(false);
          this.warehouseCreated.emit(warehouse);
          this.close();
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  /** Fill the form with random test data (dev mode only). */
  protected randomize(): void {
    const timeStr = Date.now().toString().slice(-6);
    const name = `Test WH ${timeStr}`;
    this.form.patchValue({
      name,
      code: `TST-WH-${timeStr}`,
      addressDetail: `123 Random Street, Test City ${timeStr}`,
    });
    this.form.get('code')?.markAsDirty();
  }
}
