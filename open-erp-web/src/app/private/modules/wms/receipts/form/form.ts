import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
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
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { Subject, takeUntil } from 'rxjs';
import {
  WmsService,
  Receipt,
  ReceiptStatus,
  ReceiptType,
  CreateReceiptDto,
  UpdateReceiptDto,
  ReferenceDoc,
} from '../../../../../../core/services/wms/wms.service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import {
  WarehouseService,
  Warehouse,
} from '../../../../../../core/services/warehouse/warehouse.service';
import { MpToolbar } from '../../../../../../core/components/toolbar';

interface ProductSuggestion {
  id: string;
  code: string;
  name: string;
  unit?: string;
}

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
    AutoCompleteModule,
    TextareaModule,
    DatePickerModule,
    TabsModule,
    TagModule,
    TooltipModule,
    MessageModule,
    MpToolbar,
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
  private readonly destroy$ = new Subject<void>();

  protected readonly ReceiptType = ReceiptType;
  protected readonly ReceiptStatus = ReceiptStatus;

  // State
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

  // Current org from context
  protected readonly currentOrg = this.orgContextService.currentOrganization;

  protected readonly typeOptions = Object.values(ReceiptType).map((t) => ({
    label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
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

  ngOnInit() {
    this.initForm();

    const url = this.route.snapshot.url;
    const lastSegment = url[url.length - 1]?.path;
    this.isNew.set(lastSegment === 'new');
    this.isView.set(lastSegment === 'view');

    if (!this.isNew()) {
      // Load from route data (provided by resolver)
      const receiptData = this.route.snapshot.data['receipt'] as Receipt;
      if (receiptData) {
        this.receipt.set(receiptData);
        this.populateForm(receiptData);
      }
    } else {
      // Pre-fill org from context
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

    // Pre-fill orgId from context (disabled)
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

    // Load warehouse details for display
    if (receipt.warehouseId) {
      this.warehouseService.getWarehouseById(receipt.warehouseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(wh => {
          if (wh) {
            this.selectedWarehouse.set(wh);
          }
        });
    }

    // Populate lines
    const linesArray = this.form.get('lines') as FormArray;
    linesArray.clear();
    (receipt.lines || []).forEach(line => {
      linesArray.push(this.fb.group({
        skuId: [line.skuId || ''],
        skuCode: [line.skuCode || '', Validators.required],
        skuName: [line.skuName || ''],
        orderedQty: [line.orderedQty, [Validators.required, Validators.min(0)]],
        unit: [line.unit || ''],
      }));
    });

    // Populate reference docs
    const docsArray = this.form.get('referenceDocs') as FormArray;
    docsArray.clear();
    (receipt.referenceDocs || []).forEach(doc => {
      docsArray.push(this.fb.group({
        type: [doc.type, Validators.required],
        refId: [doc.refId || ''],
        url: [doc.url || ''],
        fileName: [doc.fileName || ''],
        fileKey: [doc.fileKey || ''],
      }));
    });
  }

  // Lines FormArray
  get linesArray(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  addLine() {
    this.linesArray.push(this.fb.group({
      skuId: [''],
      skuCode: ['', Validators.required],
      skuName: [''],
      orderedQty: [1, [Validators.required, Validators.min(1)]],
      unit: ['pcs'],
    }));
  }

  removeLine(index: number) {
    this.linesArray.removeAt(index);
  }

  // Reference Docs FormArray
  get referenceDocsArray(): FormArray {
    return this.form.get('referenceDocs') as FormArray;
  }

  addReferenceDoc() {
    this.referenceDocsArray.push(this.fb.group({
      type: ['invoice', Validators.required],
      refId: [''],
      url: [''],
      fileName: [''],
      fileKey: [''],
    }));
  }

  removeReferenceDoc(index: number) {
    this.referenceDocsArray.removeAt(index);
  }

  // Warehouse autocomplete
  protected searchWarehouse(event: { query: string }) {
    const org = this.currentOrg();
    if (!org) return;
    this.warehouseLoading.set(true);
    this.warehouseService
      .getWarehouses({ search: event.query, limit: 20 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.warehouseSuggestions.set(result.items);
          this.warehouseLoading.set(false);
        },
        error: () => {
          this.warehouseLoading.set(false);
        },
      });
  }

  protected onWarehouseSelect(warehouse: Warehouse) {
    this.selectedWarehouse.set(warehouse);
    this.form.get('warehouseId')?.setValue(warehouse.id);
  }

  protected onWarehouseClear() {
    this.selectedWarehouse.set(null);
    this.form.get('warehouseId')?.setValue('');
  }

  // Save
  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const rawValue = this.form.getRawValue(); // get disabled fields too

    // Map lines: use skuCode as skuId if no explicit skuId is provided
    const mapLines = (lines: { skuId: string; skuCode: string; skuName: string; orderedQty: number; unit: string }[]) =>
      lines
        .filter((l) => l.skuCode)
        .map((l) => ({ ...l, skuId: l.skuId || l.skuCode }));

    const mapDocs = (docs: { type: string; refId: string; url: string; fileName: string; fileKey: string }[]) =>
      docs.filter((d) => d.type);

    if (this.isNew()) {
      const dto: CreateReceiptDto = {
        orgId: rawValue.orgId,
        warehouseId: rawValue.warehouseId,
        type: rawValue.type,
        poId: rawValue.poId || undefined,
        supplier: rawValue.supplier || undefined,
        shippingParty: rawValue.shippingParty || undefined,
        expectedReceiptAt: rawValue.expectedReceiptAt?.toISOString?.() || rawValue.expectedReceiptAt,
        notes: rawValue.notes || undefined,
        lines: mapLines(rawValue.lines ?? []),
        referenceDocs: mapDocs(rawValue.referenceDocs ?? []),
      };

      this.wmsService.createReceipt(dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.navigateToList();
        },
        error: () => this.saving.set(false),
      });
    } else {
      const dto: UpdateReceiptDto = {
        type: rawValue.type,
        poId: rawValue.poId || undefined,
        supplier: rawValue.supplier || undefined,
        shippingParty: rawValue.shippingParty || undefined,
        expectedReceiptAt: rawValue.expectedReceiptAt?.toISOString?.() || rawValue.expectedReceiptAt,
        notes: rawValue.notes || undefined,
        lines: mapLines(rawValue.lines ?? []),
        referenceDocs: mapDocs(rawValue.referenceDocs ?? []),
      };

      const receiptId = this.receipt()?.id;
      if (receiptId) {
        this.wmsService.updateReceipt(receiptId, dto).subscribe({
          next: () => {
            this.saving.set(false);
            this.navigateToList();
          },
          error: () => this.saving.set(false),
        });
      }
    }
  }

  protected cancel() {
    this.navigateToList();
  }

  protected goToEdit() {
    const receiptId = this.receipt()?.id;
    if (receiptId) {
      this.router.navigate(['..', 'edit'], { relativeTo: this.route });
    }
  }

  private navigateToList() {
    // Navigate to the list (go up: /:search/:page/:limit/<receiptId>/view|edit  → ../../..)
    if (this.isNew()) {
      this.router.navigate(['..'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../..'], { relativeTo: this.route });
    }
  }

  protected getStatusSeverity(
    status: ReceiptStatus,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
    const map: Record<ReceiptStatus, 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast'> = {
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
