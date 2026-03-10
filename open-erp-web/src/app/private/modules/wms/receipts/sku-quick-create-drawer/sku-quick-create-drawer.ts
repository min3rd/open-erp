import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { Subject, takeUntil } from 'rxjs';
import {
  ProductService,
  Product,
  ProductScope,
  ProductStatus,
  CreateProductDto,
} from '../../../../../../core/services/product/product.service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { slugify } from '../../../../../../core/utils/slugify';
import { isDev } from '../../../../../../core/utils/env.util';

/** Minimal unit options for quick-create */
const UNIT_OPTIONS = [
  { label: 'pcs', value: 'piece' },
  { label: 'kg', value: 'kg' },
  { label: 'g', value: 'g' },
  { label: 'liter', value: 'liter' },
  { label: 'ml', value: 'ml' },
  { label: 'meter', value: 'meter' },
  { label: 'cm', value: 'cm' },
  { label: 'box', value: 'box' },
  { label: 'set', value: 'set' },
  { label: 'pair', value: 'pair' },
];

@Component({
  selector: 'app-sku-quick-create-drawer',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DrawerModule,
  ],
  templateUrl: './sku-quick-create-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkuQuickCreateDrawer implements OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly orgContextService = inject(OrganizationContextService);
  private readonly destroy$ = new Subject<void>();

  /** Controls visibility of the drawer. Two-way bindable. */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Optional pre-filled SKU code (from free-text input). */
  @Input() prefillCode?: string;

  /** Emitted when a SKU has been successfully created. */
  @Output() skuCreated = new EventEmitter<Product>();

  protected readonly saving = signal(false);
  protected readonly isDevEnv = isDev;
  protected readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 768);
  protected readonly drawerStyle = computed(() => ({
    width: this.isMobile() ? '100vw' : '440px',
  }));

  protected readonly unitOptions = UNIT_OPTIONS;

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    unit: ['piece', [Validators.required]],
    barcode: ['', [Validators.maxLength(100)]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prefillCode'] && this.prefillCode) {
      this.form.get('code')?.setValue(this.prefillCode);
      this.form.get('code')?.markAsDirty();
    }
    if (changes['visible'] && this.visible && !this.prefillCode) {
      this.form.reset({ unit: 'piece' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onHide(): void {
    this.close();
  }

  protected close(): void {
    this.form.reset({ unit: 'piece' });
    this.saving.set(false);
    this.visibleChange.emit(false);
  }

  /** Auto-derive code from the name field when the user has not manually typed a code. */
  protected onNameInput(): void {
    const nameVal: string = this.form.get('name')?.value ?? '';
    const codeCtrl = this.form.get('code');
    if (!codeCtrl?.dirty) {
      const generated = ('SKU-' + slugify(nameVal, 30)).toUpperCase().replace(/-+/g, '-');
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

    const dto: CreateProductDto = {
      sku: (raw.code ?? '').trim(),
      name: (raw.name ?? '').trim(),
      scope: org?.id ? ProductScope.ORGANIZATION : ProductScope.GLOBAL,
      ...(org?.id ? { organizationId: org.id } : {}),
      type: 'merchandise',
      status: ProductStatus.ACTIVE,
      unit: raw.unit ?? 'piece',
      ...(raw.barcode?.trim() ? { barcode: raw.barcode.trim() } : {}),
    };

    this.productService
      .createProduct(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.saving.set(false);
          this.skuCreated.emit(product);
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
    const name = `Test SKU ${timeStr}`;
    this.form.patchValue({
      name,
      code: `SKU-TST-${timeStr}`,
      unit: 'piece',
      barcode: '',
    });
    this.form.get('code')?.markAsDirty();
  }
}
