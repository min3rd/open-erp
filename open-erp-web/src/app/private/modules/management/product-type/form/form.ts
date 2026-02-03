import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { ProductTypeService } from '../../../../../../core/services/product-type/product-type.service';
import type { ProductType, CreateProductTypeDto, UpdateProductTypeDto, AttributeDefinition } from '../product-type.types';

interface AttributeTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'management-product-type-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    DrawerModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Select,
    CheckboxModule,
    TooltipModule,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTypeForm implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private productTypeService = inject(ProductTypeService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly productTypeId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => {
    const id = this.productTypeId();
    const path = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    return id !== null && path === 'edit';
  });
  protected readonly isViewMode = computed(() => {
    const id = this.productTypeId();
    const path = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    return id !== null && path === 'view';
  });
  protected readonly isCreateMode = computed(() => this.productTypeId() === null);

  // Form
  protected form!: FormGroup;

  // Attribute type options
  protected readonly attributeTypeOptions: AttributeTypeOption[] = [
    { label: 'productTypeForm.attributes.types.string', value: 'string' },
    { label: 'productTypeForm.attributes.types.number', value: 'number' },
    { label: 'productTypeForm.attributes.types.boolean', value: 'boolean' },
    { label: 'productTypeForm.attributes.types.date', value: 'date' },
    { label: 'productTypeForm.attributes.types.select', value: 'select' },
  ];

  constructor() {
    // No constructor logic needed - drawer close handled by onHide event
  }

  ngOnInit(): void {
    // Initialize form
    this.initForm();

    // Load data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const productType = data['productType'] as ProductType | null;
      if (productType) {
        this.productTypeId.set(productType.id);
        this.patchForm(productType);
        
        // Disable form in view mode after patching
        if (this.isViewMode()) {
          this.form.disable();
        }
      }
    });

    // Get ID from route params
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.productTypeId.set(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form
   */
  private initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true],
      attributes: this.fb.array([]),
    });
  }

  /**
   * Patch form with data
   */
  private patchForm(productType: ProductType): void {
    this.form.patchValue({
      code: productType.code,
      name: productType.name,
      description: productType.description,
      isActive: productType.isActive,
    });

    // Clear and rebuild attributes array
    this.attributesArray.clear();
    if (productType.attributes && productType.attributes.length > 0) {
      productType.attributes.forEach((attr: AttributeDefinition) => {
        this.addAttribute(attr);
      });
    }
  }

  /**
   * Get attributes form array
   */
  protected get attributesArray(): FormArray {
    return this.form.get('attributes') as FormArray;
  }

  /**
   * Create attribute form group
   */
  private createAttributeGroup(attr?: AttributeDefinition): FormGroup {
    return this.fb.group({
      name: [attr?.name || '', [Validators.required]],
      type: [attr?.type || 'string', [Validators.required]],
      label: [attr?.label || ''],
      description: [attr?.description || ''],
      required: [attr?.required || false],
      options: [attr?.options?.join(', ') || ''], // Store as comma-separated string
      defaultValue: [attr?.defaultValue || ''],
    });
  }

  /**
   * Add new attribute
   */
  protected addAttribute(attr?: AttributeDefinition): void {
    this.attributesArray.push(this.createAttributeGroup(attr));
  }

  /**
   * Remove attribute
   */
  protected removeAttribute(index: number): void {
    this.attributesArray.removeAt(index);
  }

  /**
   * Check if attribute type is select
   */
  protected isSelectType(index: number): boolean {
    const attrGroup = this.attributesArray.at(index) as FormGroup;
    return attrGroup.get('type')?.value === 'select';
  }

  /**
   * Save form
   */
  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('common.error'),
        detail: this.translocoService.translate('productTypeForm.messages.validationError'),
      });
      return;
    }

    this.isSaving.set(true);

    const formValue = this.form.value;

    // Process attributes - convert options from string to array
    const attributes: AttributeDefinition[] = formValue.attributes.map((attr: any) => ({
      name: attr.name,
      type: attr.type,
      label: attr.label || undefined,
      description: attr.description || undefined,
      required: attr.required,
      options: attr.options ? attr.options.split(',').map((o: string) => o.trim()).filter((o: string) => o) : undefined,
      defaultValue: attr.defaultValue || undefined,
    }));

    const dto: CreateProductTypeDto | UpdateProductTypeDto = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || undefined,
      isActive: formValue.isActive,
      attributes,
    };

    if (this.isEditMode()) {
      // Update
      const id = this.productTypeId();
      if (id) {
        this.productTypeService.updateProductType(id, dto as UpdateProductTypeDto).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('common.success'),
              detail: this.translocoService.translate('productTypeForm.messages.updated'),
            });
            this.isSaving.set(false);
            this.onClose();
          },
          error: (error: any) => {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('common.error'),
              detail: error?.error?.message || this.translocoService.translate('productTypeForm.messages.saveError'),
            });
            this.isSaving.set(false);
          }
        });
      }
    } else {
      // Create
      this.productTypeService.createProductType(dto as CreateProductTypeDto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('common.success'),
            detail: this.translocoService.translate('productTypeForm.messages.created'),
          });
          this.isSaving.set(false);
          this.onClose();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('common.error'),
            detail: error?.error?.message || this.translocoService.translate('productTypeForm.messages.saveError'),
          });
          this.isSaving.set(false);
        }
      });
    }
  }

  /**
   * Close drawer
   */
  protected onClose(): void {
    // Navigate back to list, preserving current state
    const scope = this.route.snapshot.paramMap.get('scope') || 'all';
    const search = this.route.snapshot.paramMap.get('search') || '-';
    const page = this.route.snapshot.paramMap.get('page') || '1';
    const limit = this.route.snapshot.paramMap.get('limit') || '100';

    this.router.navigate(['/management', 'product-type', scope, search, page, limit]);
  }

  /**
   * Switch to edit mode
   */
  protected onEdit(): void {
    const id = this.productTypeId();
    if (id) {
      const scope = this.route.snapshot.paramMap.get('scope') || 'all';
      const search = this.route.snapshot.paramMap.get('search') || '-';
      const page = this.route.snapshot.paramMap.get('page') || '1';
      const limit = this.route.snapshot.paramMap.get('limit') || '100';

      this.router.navigate(['/management', 'product-type', scope, search, page, limit, id, 'edit']);
    }
  }

  /**
   * Get form control
   */
  protected getControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  /**
   * Check if field has error
   */
  protected hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.hasError(errorName) && control.touched);
  }

  /**
   * Get attribute form group
   */
  protected getAttributeGroup(index: number): FormGroup {
    return this.attributesArray.at(index) as FormGroup;
  }

  /**
   * Check if attribute field has error
   */
  protected hasAttributeError(index: number, controlName: string, errorName: string): boolean {
    const group = this.getAttributeGroup(index);
    const control = group.get(controlName);
    return !!(control && control.hasError(errorName) && control.touched);
  }
}
