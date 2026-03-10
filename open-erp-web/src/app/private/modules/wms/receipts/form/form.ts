import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { Subject, takeUntil } from 'rxjs';
import {
  WmsService,
  Receipt,
  ReceiptStatus,
  ReceiptType,
  CreateReceiptDto,
  UpdateReceiptDto,
  ReferenceDoc,
  MinioObject,
} from '../../../../../../core/services/wms/wms.service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import {
  WarehouseService,
  Warehouse,
} from '../../../../../../core/services/warehouse/warehouse.service';
import {
  ProductService,
  Product,
  ProductScope,
} from '../../../../../../core/services/product/product.service';
import { AuthService } from '../../../../../../core/services/auth-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuickWarehouseDrawer } from '../quick-warehouse-drawer/quick-warehouse-drawer';
import { SkuQuickCreateDrawer } from '../sku-quick-create-drawer/sku-quick-create-drawer';

@Component({
  selector: 'receipt-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    AutoCompleteModule,
    TextareaModule,
    DatePickerModule,
    TabsModule,
    TagModule,
    TooltipModule,
    DrawerModule,
    QuickWarehouseDrawer,
    SkuQuickCreateDrawer,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly wmsService = inject(WmsService);
  private readonly orgContextService = inject(OrganizationContextService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  protected readonly ReceiptType = ReceiptType;
  protected readonly ReceiptStatus = ReceiptStatus;

  // Drawer state
  drawerVisible = signal(false);
  drawerStyle = computed(() => ({ width: this.isMobile() ? '100vw' : '760px' }));
  isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  // Quick-create warehouse drawer
  protected readonly quickWarehouseDrawerVisible = signal(false);

  // Catalog scope toggle: 'global' | 'org'
  protected readonly catalogScope = signal<'global' | 'org'>('org');

  // Quick-create SKU drawer
  protected readonly quickSkuDrawerVisible = signal(false);
  protected readonly quickSkuPrefillCode = signal<string | undefined>(undefined);
  /** Index of the line that triggered the quick-create SKU drawer */
  protected readonly quickSkuLineIndex = signal<number | null>(null);

  // Permission: can the current user create a warehouse?
  private readonly _currentUser = toSignal(this.authService.user$, { initialValue: null });
  protected readonly canCreateWarehouse = computed(() => {
    const user = this._currentUser();
    if (!user) return false;
    const perms: string[] = user.permissions ?? [];
    return perms.includes('warehouses.create') || perms.includes('warehouses.manage');
  });

  // Form state
  receipt = signal<Receipt | null>(null);
  loading = signal(false);
  saving = signal(false);
  isNew = signal(true);
  isView = signal(false);
  activeTab = signal(0);

  // Warehouse autocomplete
  warehouseSuggestions = signal<Warehouse[]>([]);
  selectedWarehouse = signal<Warehouse | null>(null);
  warehouseLoading = signal(false);

  // Product (SKU) autocomplete
  productSuggestions = signal<Product[]>([]);
  productLoading = signal(false);

  // File upload per reference doc
  uploadingDoc = signal<Record<number, boolean>>({});

  // Line options for multi-select in reference docs (computed from linesArray signal won't
  // reactively update since FormArray isn't a signal, so we keep the getter but call it only
  // when the template needs it — it is stable enough since linesArray changes trigger CD)
  protected get lineOptions() {
    return this.linesArray.controls.map((ctrl, i) => ({
      label: (ctrl.get('skuCode')?.value as string) || `Line ${i + 1}`,
      value: String(i),
    }));
  }

  // Current org from context
  protected readonly currentOrg = this.orgContextService.currentOrganization;

  protected readonly typeOptions = Object.values(ReceiptType).map((t) => ({
    label: t.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: t,
  }));

  protected readonly refDocTypes = [
    { label: 'Invoice', value: 'invoice' },
    { label: 'Purchase Order', value: 'po' },
    { label: 'Transfer Note', value: 'transfer_note' },
    { label: 'Delivery Note', value: 'delivery_note' },
    { label: 'Bill of Lading', value: 'bill_of_lading' },
    { label: 'Other', value: 'other' },
  ];

  form!: FormGroup;

  constructor() {
    // Open drawer after the first render to allow the host view to be attached
    afterNextRender(() => this.drawerVisible.set(true));
  }

  ngOnInit() {
    this.initForm();

    const url = this.route.snapshot.url;
    const lastSegment = url[url.length - 1]?.path;
    this.isNew.set(lastSegment === 'new');
    this.isView.set(lastSegment === 'view');

    if (!this.isNew()) {
      const receiptData = this.route.snapshot.data['receipt'] as Receipt;
      if (receiptData) {
        this.receipt.set(receiptData);
        this.populateForm(receiptData);
      }
    } else {
      const org = this.currentOrg();
      if (org) {
        this.form.get('orgId')?.setValue(org.id);
      }
    }

    if (this.isView()) {
      this.form.disable();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onDrawerHide() {
    if (this.drawerVisible()) {
      this.drawerVisible.set(false);
    }
    this.navigateToList();
  }

  private initForm() {
    this.form = this.fb.group({
      orgId: [{ value: '', disabled: true }],
      warehouseId: ['', Validators.required],
      type: [ReceiptType.MANUAL, Validators.required],
      poId: [''],
      supplier: [''],
      shippingParty: [''],
      expectedReceiptAt: [null],
      notes: [''],
      lines: this.fb.array([]),
      referenceDocs: this.fb.array([]),
    });

    const org = this.currentOrg();
    if (org) {
      this.form.get('orgId')?.setValue(org.id);
    }
  }

  private populateForm(receipt: Receipt) {
    this.form.patchValue({
      orgId: receipt.orgId,
      warehouseId: receipt.warehouseId,
      type: receipt.type,
      poId: receipt.poId || '',
      supplier: receipt.supplier || '',
      shippingParty: receipt.shippingParty || '',
      expectedReceiptAt: receipt.expectedReceiptAt ? new Date(receipt.expectedReceiptAt) : null,
      notes: receipt.notes || '',
    });

    if (receipt.warehouseId) {
      this.warehouseService
        .getWarehouseById(receipt.warehouseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((wh) => {
          if (wh) this.selectedWarehouse.set(wh);
        });
    }

    const linesArray = this.form.get('lines') as FormArray;
    linesArray.clear();
    (receipt.lines || []).forEach((line) => {
      linesArray.push(
        this.fb.group({
          skuId: [line.skuId || ''],
          skuCode: [line.skuCode || '', Validators.required],
          skuName: [line.skuName || ''],
          orderedQty: [line.orderedQty, [Validators.required, Validators.min(0)]],
          unit: [line.unit || ''],
        }),
      );
    });

    const docsArray = this.form.get('referenceDocs') as FormArray;
    docsArray.clear();
    (receipt.referenceDocs || []).forEach((doc) => {
      docsArray.push(
        this.fb.group({
          type: [doc.type, Validators.required],
          refId: [doc.refId || ''],
          url: [doc.url || ''],
          attachment: [doc.attachment ?? null],
          lineIds: [doc.lineIds || []],
        }),
      );
    });
  }

  // Lines FormArray
  get linesArray(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  addLine() {
    this.linesArray.push(
      this.fb.group({
        skuId: [''],
        skuCode: ['', Validators.required],
        skuName: [''],
        orderedQty: [1, [Validators.required, Validators.min(1)]],
        unit: ['pcs'],
      }),
    );
  }

  removeLine(index: number) {
    this.linesArray.removeAt(index);
  }

  // Reference Docs FormArray
  get referenceDocsArray(): FormArray {
    return this.form.get('referenceDocs') as FormArray;
  }

  addReferenceDoc() {
    this.referenceDocsArray.push(
      this.fb.group({
        type: ['invoice', Validators.required],
        refId: [''],
        url: [''],
        attachment: [null],
        lineIds: [[]],
      }),
    );
  }

  removeReferenceDoc(index: number) {
    this.referenceDocsArray.removeAt(index);
  }

  // ── Warehouse autocomplete ─────────────────────────────────────────────
  protected searchWarehouse(event: { query: string }) {
    this.warehouseLoading.set(true);
    this.warehouseService
      .getWarehouses({ search: event.query, limit: 20 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.warehouseSuggestions.set(result.items);
          this.warehouseLoading.set(false);
        },
        error: () => this.warehouseLoading.set(false),
      });
  }

  protected onWarehouseSelect(event: AutoCompleteSelectEvent) {
    const warehouse = event.value as Warehouse;
    this.selectedWarehouse.set(warehouse);
    this.form.get('warehouseId')?.setValue(warehouse.id);
  }

  protected onWarehouseClear() {
    this.selectedWarehouse.set(null);
    this.form.get('warehouseId')?.setValue('');
  }

  /**
   * Opens the quick-create warehouse drawer.
   */
  protected quickCreateWarehouse() {
    this.quickWarehouseDrawerVisible.set(true);
  }

  /**
   * Called when the quick-create drawer successfully creates a warehouse.
   * Adds the new warehouse to the suggestions list and auto-selects it.
   */
  protected onQuickWarehouseCreated(warehouse: Warehouse) {
    this.selectedWarehouse.set(warehouse);
    this.form.get('warehouseId')?.setValue(warehouse.id);
    this.warehouseSuggestions.update((list) => [warehouse, ...list]);
  }

  // ── Product (SKU) autocomplete ─────────────────────────────────────────
  protected searchProduct(event: { query: string }) {
    this.productLoading.set(true);
    const org = this.currentOrg();
    const scope = this.catalogScope();
    this.productService
      .getProducts({
        search: event.query,
        limit: 20,
        scope: scope === 'global' ? ProductScope.GLOBAL : ProductScope.ORGANIZATION,
        ...(scope === 'org' && org?.id ? { organizationId: org.id } : {}),
      } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.productSuggestions.set(result.items);
          this.productLoading.set(false);
        },
        error: () => this.productLoading.set(false),
      });
  }

  protected onProductSelect(event: AutoCompleteSelectEvent, lineIndex: number) {
    const product = event.value as Product;
    const lineGroup = this.linesArray.at(lineIndex);
    lineGroup.patchValue({
      skuId: product.id,
      skuCode: product.sku,
      skuName: product.name,
      unit: product.unit || 'pcs',
    });
  }

  /**
   * Toggles the catalog scope between global and org.
   */
  protected toggleCatalogScope(scope: 'global' | 'org'): void {
    this.catalogScope.set(scope);
    // Clear existing suggestions when scope changes
    this.productSuggestions.set([]);
  }

  /**
   * Opens the quick-create SKU drawer, optionally pre-filling the code from
   * free-text input on the given line.
   */
  protected quickCreateSku(lineIndex: number): void {
    const currentCode = this.linesArray.at(lineIndex)?.get('skuCode')?.value as string | undefined;
    this.quickSkuPrefillCode.set(currentCode || undefined);
    this.quickSkuLineIndex.set(lineIndex);
    this.quickSkuDrawerVisible.set(true);
  }

  /**
   * Called when the quick-create drawer successfully creates a SKU.
   * Auto-selects the new SKU into the line that triggered the drawer.
   */
  protected onSkuCreated(product: Product): void {
    const lineIndex = this.quickSkuLineIndex();
    if (lineIndex !== null && lineIndex < this.linesArray.length) {
      const lineGroup = this.linesArray.at(lineIndex);
      lineGroup.patchValue({
        skuId: product.id,
        skuCode: product.sku,
        skuName: product.name,
        unit: product.unit || 'pcs',
      });
    }
    this.quickSkuLineIndex.set(null);
    this.productSuggestions.update((list) => [product, ...list]);
  }

  // ── File upload ────────────────────────────────────────────────────────
  // Triggers the hidden file input at the given row index.
  // Note: we use document.getElementById rather than @ViewChildren because the inputs are
  // inside a *ngFor and dynamically rendered inside a p-drawer portal — the same pattern
  // used by ProductService.uploadFileToPresignedUrl() in this codebase.
  protected triggerFileInput(index: number) {
    (document.getElementById(`file-input-${index}`) as HTMLInputElement | null)?.click();
  }

  protected onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so the same file can be re-selected after clearing
    input.value = '';
    if (!file) return;

    const receiptId = this.receipt()?.id;
    if (!receiptId) return;

    this.uploadingDoc.update((s) => ({ ...s, [index]: true }));

    this.wmsService
      .getReceiptUploadUrl(receiptId, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Upload directly to the presigned MinIO URL without sending the JWT auth header
          // (same pattern as ProductService.uploadFileToPresignedUrl)
          fetch(result.uploadUrl, {
            method: result.method || 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
          })
            .then((resp) => {
              if (resp.ok) {
                const attachment: MinioObject = {
                  fileKey: result.fileKey,
                  fileName: file.name,
                  mimeType: file.type,
                  fileSize: file.size,
                };
                this.referenceDocsArray.at(index).patchValue({ attachment });
              } else {
                console.error(`File upload failed with HTTP ${resp.status}`);
              }
              this.uploadingDoc.update((s) => ({ ...s, [index]: false }));
            })
            .catch((err) => {
              console.error('File upload error:', err);
              this.uploadingDoc.update((s) => ({ ...s, [index]: false }));
            });
        },
        error: (err) => {
          console.error('Failed to get upload URL:', err);
          this.uploadingDoc.update((s) => ({ ...s, [index]: false }));
        },
      });
  }

  protected getDocAttachment(index: number): MinioObject | null {
    return this.referenceDocsArray.at(index)?.get('attachment')?.value ?? null;
  }

  protected clearDocAttachment(index: number) {
    this.referenceDocsArray.at(index)?.get('attachment')?.setValue(null);
  }

  // ── Save ───────────────────────────────────────────────────────────────
  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const rawValue = this.form.getRawValue();

    const mapLines = (
      lines: {
        skuId: string;
        skuCode: string;
        skuName: string;
        orderedQty: number;
        unit: string;
      }[],
    ) => lines.filter((l) => l.skuCode).map((l) => ({ ...l, skuId: l.skuId || l.skuCode }));

    const mapDocs = (
      docs: {
        type: string;
        refId: string;
        url: string;
        attachment: MinioObject | null;
        lineIds: string[];
      }[],
    ) =>
      docs
        .filter((d) => d.type)
        .map(({ attachment, ...rest }) => ({
          ...rest,
          ...(attachment ? { attachment } : {}),
        }));

    if (this.isNew()) {
      const dto: CreateReceiptDto = {
        orgId: rawValue.orgId,
        warehouseId: rawValue.warehouseId,
        type: rawValue.type,
        poId: rawValue.poId || undefined,
        supplier: rawValue.supplier || undefined,
        shippingParty: rawValue.shippingParty || undefined,
        expectedReceiptAt:
          rawValue.expectedReceiptAt?.toISOString?.() || rawValue.expectedReceiptAt,
        notes: rawValue.notes || undefined,
        lines: mapLines(rawValue.lines ?? []),
        referenceDocs: mapDocs(rawValue.referenceDocs ?? []) as any,
      };

      this.wmsService.createReceipt(dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDrawer();
        },
        error: () => this.saving.set(false),
      });
    } else {
      const dto: UpdateReceiptDto = {
        type: rawValue.type,
        poId: rawValue.poId || undefined,
        supplier: rawValue.supplier || undefined,
        shippingParty: rawValue.shippingParty || undefined,
        expectedReceiptAt:
          rawValue.expectedReceiptAt?.toISOString?.() || rawValue.expectedReceiptAt,
        notes: rawValue.notes || undefined,
        lines: mapLines(rawValue.lines ?? []),
        referenceDocs: mapDocs(rawValue.referenceDocs ?? []) as any,
      };

      const receiptId = this.receipt()?.id;
      if (receiptId) {
        this.wmsService.updateReceipt(receiptId, dto).subscribe({
          next: () => {
            this.saving.set(false);
            this.closeDrawer();
          },
          error: () => this.saving.set(false),
        });
      }
    }
  }

  protected cancel() {
    this.closeDrawer();
  }

  protected goToEdit() {
    const receiptId = this.receipt()?.id;
    if (receiptId) {
      this.router.navigate(['..', 'edit'], { relativeTo: this.route });
    }
  }

  private closeDrawer() {
    this.drawerVisible.set(false);
  }

  private navigateToList() {
    if (this.isNew()) {
      this.router.navigate(['..'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../..'], { relativeTo: this.route });
    }
  }

  protected getStatusSeverity(
    status: ReceiptStatus,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
    const map: Record<
      ReceiptStatus,
      'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast'
    > = {
      [ReceiptStatus.COMPLETED]: 'success',
      [ReceiptStatus.QC_PASSED]: 'success',
      [ReceiptStatus.FINALIZED]: 'success',
      [ReceiptStatus.APPROVED]: 'info',
      [ReceiptStatus.UNDER_REVIEW]: 'info',
      [ReceiptStatus.PARTIAL]: 'warn',
      [ReceiptStatus.QC_PENDING]: 'warn',
      [ReceiptStatus.QC_FAILED]: 'danger',
      [ReceiptStatus.CANCELLED]: 'danger',
      [ReceiptStatus.REJECTED]: 'danger',
      [ReceiptStatus.PENDING]: 'info',
      [ReceiptStatus.RECEIVED]: 'success',
      [ReceiptStatus.DRAFT]: 'secondary',
    };
    return map[status] ?? 'secondary';
  }
}
