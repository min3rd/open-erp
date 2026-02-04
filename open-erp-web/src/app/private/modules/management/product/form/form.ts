import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  effect,
  ViewChild,
  ElementRef,
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
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { InputNumberModule } from 'primeng/inputnumber';

// Core services and utilities
import {
  ProductService,
  Product,
  ProductScope,
  ProductStatus,
  CreateProductDto,
} from '../../../../../../core/services/product/product.service';
import { ProductTypeService } from '../../../../../../core/services/product-type/product-type.service';
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { slugify } from '../../../../../../core/utils/slugify';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'management-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DrawerModule,
    Select,
    DividerModule,
    TooltipModule,
    TabsModule,
    InputNumberModule,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm implements OnInit {
  @ViewChild('thumbnailInput') thumbnailInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly productTypeService = inject(ProductTypeService);
  private readonly productCategoryService = inject(ProductCategoryService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  protected readonly product = signal<Product | null>(null);
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly thumbnailPreview = signal<string | null>(null);
  protected readonly activeTabIndex = signal<number>(0);
  protected readonly ProductScope = ProductScope;
  protected readonly ProductStatus = ProductStatus;

  // Dropdown options
  protected readonly scopeOptions: SelectOption[] = [
    { label: 'Global', value: ProductScope.GLOBAL },
    { label: 'Organization', value: ProductScope.ORGANIZATION },
  ];

  protected readonly statusOptions: SelectOption[] = [
    { label: 'Draft', value: ProductStatus.DRAFT },
    { label: 'Active', value: ProductStatus.ACTIVE },
    { label: 'Inactive', value: ProductStatus.INACTIVE },
    { label: 'Discontinued', value: ProductStatus.DISCONTINUED },
  ];

  protected typeOptions = signal<SelectOption[]>([]);
  protected categoryOptions = signal<SelectOption[]>([]);

  protected form!: FormGroup;

  constructor() {
    // Auto-generate slug from name
    effect(() => {
      const nameControl = this.form?.get('name');
      if (nameControl) {
        nameControl.valueChanges.subscribe((value) => {
          if (value && !this.product()) {
            // Only auto-generate for new products
            const slug = slugify(value, 128);
            this.form.get('slug')?.setValue(slug, { emitEvent: false });
          }
        });
      }
    });
  }

  ngOnInit(): void {
    // Initialize form
    this.form = this.fb.group({
      // Header fields
      scope: [ProductScope.ORGANIZATION, [Validators.required]],
      organizationId: [''],
      sku: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      slug: ['', [Validators.maxLength(128)]],
      status: [ProductStatus.DRAFT, [Validators.required]],
      
      // General info tab
      internationalName: ['', [Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      type: ['', [Validators.required]],
      categoryId: [''],
      barcode: ['', [Validators.maxLength(50)]],
      unit: ['', [Validators.required, Validators.maxLength(20)]],
      
      // Dimensions tab
      weight: [null],
      length: [null],
      width: [null],
      height: [null],
      
      // Storage conditions tab
      storageConditions: ['', [Validators.maxLength(500)]],
      expiryDays: [null],
      
      // Warehouse settings tab
      warehouseSettings: [{}],
      
      // Custom fields tab
      metadata: [{}],
    });

    // Load dropdown data
    this.loadProductTypes();
    this.loadProductCategories();

    // Load product data if in edit/view mode
    this.route.data.subscribe((data) => {
      const product = data['product'] as Product;
      if (product) {
        this.product.set(product);
        this.populateForm(product);
      }
    });
  }

  /**
   * Load product types for dropdown
   */
  private loadProductTypes(): void {
    this.productTypeService.getProductTypes({ limit: 1000, isActive: true }).subscribe({
      next: (result) => {
        const options: SelectOption[] = result.items.map((type) => ({
          label: type.name,
          value: type.code,
        }));
        this.typeOptions.set(options);
      },
      error: (error) => {
        console.error('Error loading product types:', error);
      },
    });
  }

  /**
   * Load product categories for dropdown
   */
  private loadProductCategories(): void {
    this.productCategoryService.getProductCategories({ limit: 1000, isActive: true }).subscribe({
      next: (result) => {
        const options: SelectOption[] = result.items.map((cat) => ({
          label: cat.name,
          value: cat.id,
        }));
        this.categoryOptions.set(options);
      },
      error: (error) => {
        console.error('Error loading product categories:', error);
      },
    });
  }

  /**
   * Populate form with product data
   */
  private populateForm(product: Product): void {
    this.form.patchValue({
      scope: product.scope,
      organizationId: product.organizationId || '',
      sku: product.sku,
      name: product.name,
      slug: product.metadata?.['slug'] || '',
      status: product.status,
      internationalName: product.internationalName || '',
      description: product.description || '',
      type: product.type,
      categoryId: product.categoryId || '',
      barcode: product.barcode || '',
      unit: product.unit,
      weight: product.metadata?.['weight'] || null,
      length: product.metadata?.['length'] || null,
      width: product.metadata?.['width'] || null,
      height: product.metadata?.['height'] || null,
      storageConditions: product.metadata?.['storageConditions'] || '',
      expiryDays: product.metadata?.['expiryDays'] || null,
      warehouseSettings: product.metadata?.['warehouseSettings'] || {},
      metadata: product.metadata || {},
    });
  }

  /**
   * Handle thumbnail file selection
   */
  protected onThumbnailSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productForm.messages.error'),
        detail: this.translocoService.translate('productForm.messages.invalidFileType'),
      });
      input.value = '';
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productForm.messages.error'),
        detail: this.translocoService.translate('productForm.messages.fileTooLarge'),
      });
      input.value = '';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.thumbnailPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Trigger thumbnail file input
   */
  protected onSelectThumbnail(): void {
    this.thumbnailInput?.nativeElement?.click();
  }

  /**
   * Clear thumbnail preview
   */
  protected onClearThumbnail(): void {
    this.thumbnailPreview.set(null);
    if (this.thumbnailInput?.nativeElement) {
      this.thumbnailInput.nativeElement.value = '';
    }
  }

  /**
   * Fill form with random data for testing
   */
  protected onRandomize(): void {
    const randomSku = `SKU-${Math.floor(Math.random() * 100000)}`;
    const randomName = `Product ${Math.floor(Math.random() * 1000)}`;
    
    this.form.patchValue({
      sku: randomSku,
      name: randomName,
      slug: slugify(randomName, 128),
      internationalName: `International ${randomName}`,
      description: 'This is a randomly generated product description for testing purposes.',
      barcode: `${Math.floor(Math.random() * 1000000000000)}`,
      unit: 'pcs',
      weight: Math.floor(Math.random() * 100) / 10,
      length: Math.floor(Math.random() * 100),
      width: Math.floor(Math.random() * 100),
      height: Math.floor(Math.random() * 100),
      storageConditions: 'Store in a cool, dry place',
      expiryDays: Math.floor(Math.random() * 365),
    });

    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('productForm.messages.randomized'),
    });
  }

  /**
   * Save as draft
   */
  protected onSaveDraft(): void {
    this.form.patchValue({ status: ProductStatus.DRAFT });
    this.onSave();
  }

  /**
   * Save form (create product)
   */
  protected onSave(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });

    if (this.form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productForm.messages.error'),
        detail: this.translocoService.translate('productForm.messages.validationFailed'),
      });
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    // Build metadata object
    const metadata: Record<string, any> = {
      slug: formValue.slug,
      weight: formValue.weight,
      length: formValue.length,
      width: formValue.width,
      height: formValue.height,
      storageConditions: formValue.storageConditions,
      expiryDays: formValue.expiryDays,
      warehouseSettings: formValue.warehouseSettings,
      ...formValue.metadata,
    };

    // Build DTO
    const dto: CreateProductDto = {
      scope: formValue.scope,
      organizationId: formValue.organizationId || undefined,
      sku: formValue.sku,
      name: formValue.name,
      internationalName: formValue.internationalName || undefined,
      description: formValue.description || undefined,
      type: formValue.type,
      status: formValue.status,
      unit: formValue.unit,
      categoryId: formValue.categoryId || undefined,
      barcode: formValue.barcode || undefined,
      metadata,
    };

    this.productService.createProduct(dto).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('productForm.messages.success'),
          detail: this.translocoService.translate('productForm.messages.createSuccess'),
        });
        this.onClose();
      },
      error: (error) => {
        console.error('Save failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productForm.messages.error'),
          detail:
            error?.error?.message ||
            this.translocoService.translate('productForm.messages.saveFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Close form and navigate back to list
   */
  protected async onClose(): Promise<void> {
    try {
      // For new mode: go up 1 level (../)
      await this.router.navigate(['..'], { relativeTo: this.route });
    } finally {
      this.isVisible.set(false);
    }
  }
}
