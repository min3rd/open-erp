import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DrawerModule } from 'primeng/drawer';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

// Core services
import {
  ProductTypeService,
  ProductType,
  CreateProductTypeDto,
  UpdateProductTypeDto,
  AttributeDefinition,
} from '../../../../../../core/services/product-type/product-type.service';

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
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DrawerModule,
    Select,
    ToggleSwitchModule,
    DividerModule,
    TooltipModule,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTypeForm implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productTypeService = inject(ProductTypeService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  protected readonly productType = signal<ProductType | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly isViewMode = signal(false);
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);

  // Attribute type options
  protected readonly attributeTypeOptions: AttributeTypeOption[] = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'Select', value: 'select' },
  ];

  protected form!: FormGroup;

  // Computed: Check if attributes form array has items
  protected readonly hasAttributes = computed(() => {
    return this.attributesArray?.length > 0;
  });

  ngOnInit(): void {
    // Initialize form
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      isActive: [true],
      attributes: this.fb.array([]),
    });

    // Determine mode from route
    const routePath = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.isViewMode.set(routePath === 'view');
    this.isEditMode.set(routePath === 'edit');

    // Load product type data if available
    this.route.data.subscribe((data) => {
      const productType = data['productType'] as ProductType;
      if (productType) {
        this.productType.set(productType);

        // Populate form from product type data
        this.form.patchValue({
          code: productType.code,
          name: productType.name,
          description: productType.description || '',
          isActive: productType.isActive,
        });

        // Populate attributes
        if (productType.attributes && productType.attributes.length > 0) {
          productType.attributes.forEach((attr) => this.addAttribute(attr));
        }

        if (this.isViewMode()) {
          this.form.disable();
        }
      }
    });
  }

  /**
   * Get attributes FormArray
   */
  get attributesArray(): FormArray {
    return this.form.get('attributes') as FormArray;
  }

  /**
   * Add a new attribute to the form
   */
  protected addAttribute(attribute?: AttributeDefinition): void {
    const attributeGroup = this.fb.group({
      name: [attribute?.name || '', [Validators.required]],
      type: [attribute?.type || 'string', [Validators.required]],
      label: [attribute?.label || ''],
      description: [attribute?.description || ''],
      required: [attribute?.required || false],
      options: [attribute?.options?.join(', ') || ''],
      defaultValue: [attribute?.defaultValue || ''],
    });

    this.attributesArray.push(attributeGroup);
  }

  /**
   * Remove attribute at index
   */
  protected removeAttribute(index: number): void {
    this.attributesArray.removeAt(index);
  }

  /**
   * Check if attribute at index is select type
   */
  protected isSelectType(index: number): boolean {
    const attr = this.attributesArray.at(index);
    return attr?.get('type')?.value === 'select';
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
        summary: this.translocoService.translate('productTypeForm.messages.error'),
        detail: this.translocoService.translate('productTypeForm.messages.validationFailed'),
      });
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    // Build attributes array
    const attributes: AttributeDefinition[] = formValue.attributes.map((attr: any) => {
      const attribute: AttributeDefinition = {
        name: attr.name,
        type: attr.type,
      };
      if (attr.label) attribute.label = attr.label;
      if (attr.description) attribute.description = attr.description;
      if (attr.required) attribute.required = attr.required;
      if (attr.type === 'select' && attr.options) {
        attribute.options = attr.options
          .split(',')
          .map((o: string) => o.trim())
          .filter((o: string) => o);
      }
      if (attr.defaultValue) attribute.defaultValue = attr.defaultValue;
      return attribute;
    });

    // Build DTO
    const dto: CreateProductTypeDto | UpdateProductTypeDto = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || undefined,
      isActive: formValue.isActive,
      attributes: attributes.length > 0 ? attributes : undefined,
    };

    const saveOperation = this.productType()
      ? this.productTypeService.updateProductType(this.productType()!._id, dto)
      : this.productTypeService.createProductType(dto as CreateProductTypeDto);

    saveOperation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('productTypeForm.messages.success'),
          detail: this.translocoService.translate(
            this.productType()
              ? 'productTypeForm.messages.updateSuccess'
              : 'productTypeForm.messages.createSuccess'
          ),
        });
        this.onClose();
      },
      error: (error) => {
        console.error('Save failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productTypeForm.messages.error'),
          detail: error?.error?.message || this.translocoService.translate('productTypeForm.messages.saveFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to list - use relative navigation to parent
    if (this.productType()) {
      // For edit/view mode: go up 2 levels (../../)
      this.router.navigate(['../..'], { relativeTo: this.route });
    } else {
      // For new mode: go up 1 level (../)
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
