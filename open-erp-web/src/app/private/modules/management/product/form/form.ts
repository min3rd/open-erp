import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { slugify } from '../../../../../../core/utils/slugify';

interface SelectOption {
  label: string;
  value: string;
  code?: string;
  name?: string;
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
  @ViewChild('mediaInput') mediaInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly productTypeService = inject(ProductTypeService);
  private readonly productCategoryService = inject(ProductCategoryService);
  private readonly organizationContext = inject(OrganizationContextService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

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

  // Unit options from backend enum
  protected readonly unitOptions: SelectOption[] = [
    { label: 'Kilogram (kg)', value: 'kg' },
    { label: 'Gram (g)', value: 'g' },
    { label: 'Ton', value: 'ton' },
    { label: 'Pound (lb)', value: 'lb' },
    { label: 'Liter', value: 'liter' },
    { label: 'Milliliter (ml)', value: 'ml' },
    { label: 'Cubic Meter (m³)', value: 'm3' },
    { label: 'Gallon', value: 'gallon' },
    { label: 'Meter (m)', value: 'meter' },
    { label: 'Centimeter (cm)', value: 'cm' },
    { label: 'Millimeter (mm)', value: 'mm' },
    { label: 'Inch', value: 'inch' },
    { label: 'Square Meter (m²)', value: 'm2' },
    { label: 'Square Foot (sqf)', value: 'sqf' },
    { label: 'Piece', value: 'piece' },
    { label: 'Box', value: 'box' },
    { label: 'Carton', value: 'carton' },
    { label: 'Pallet', value: 'pallet' },
    { label: 'Container', value: 'container' },
    { label: 'Pack', value: 'pack' },
    { label: 'Set', value: 'set' },
    { label: 'Pair', value: 'pair' },
    { label: 'Dozen', value: 'dozen' },
  ];

  protected typeOptions = signal<SelectOption[]>([]);
  protected categoryOptions = signal<SelectOption[]>([]);
  protected organizationOptions = signal<SelectOption[]>([]);
  
  // Upload-related state
  protected thumbnailFile: File | null = null;
  protected mediaFiles = signal<File[]>([]);

  protected form!: FormGroup;

  ngOnInit(): void {
    // Load user organizations
    const userOrgs = this.organizationContext.userOrganizations();
    const orgOptions = userOrgs.map(org => ({
      label: org.name,
      value: org.id,
      code: org.code
    }));
    this.organizationOptions.set(orgOptions);

    // Get current organization
    const currentOrg = this.organizationContext.currentOrganization();
    const defaultOrgId = currentOrg?.id || '';

    // Initialize form
    this.form = this.fb.group({
      // Header fields
      scope: [ProductScope.ORGANIZATION, [Validators.required]],
      organizationId: [defaultOrgId], // Auto-populate with current org
      sku: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      slug: ['', [Validators.maxLength(128)]],
      status: [ProductStatus.DRAFT, [Validators.required]],
      
      // General info tab
      internationalName: ['', [Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      type: ['', [Validators.required]],
      categoryId: [''],
      categoryName: [''],
      barcode: ['', [Validators.maxLength(50)]],
      unit: ['piece', [Validators.required]], // Default to 'piece'
      
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

    // Auto-generate slug from name for new products
    this.form.get('name')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value && !this.product()) {
          // Only auto-generate for new products
          const slug = slugify(value, 128);
          this.form.get('slug')?.setValue(slug, { emitEvent: false });
        }
      });

    // Update categoryName when categoryId changes
    this.form.get('categoryId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categoryId) => {
        if (categoryId) {
          const category = this.categoryOptions().find(c => c.value === categoryId);
          this.form.get('categoryName')?.setValue(category?.name || '', { emitEvent: false });
        } else {
          this.form.get('categoryName')?.setValue('', { emitEvent: false });
        }
      });

    // Auto-populate organizationId when scope changes
    this.form.get('scope')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scope) => {
        if (scope === ProductScope.ORGANIZATION) {
          // Auto-populate with current organization
          const currentOrg = this.organizationContext.currentOrganization();
          if (currentOrg?.id) {
            this.form.get('organizationId')?.setValue(currentOrg.id, { emitEvent: false });
          }
        } else {
          // Clear organizationId for global scope
          this.form.get('organizationId')?.setValue('', { emitEvent: false });
        }
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
          code: cat.code,
          name: cat.name,
        } as any));
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

    // Store the file for later upload
    this.thumbnailFile = file;

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
    this.thumbnailFile = null;
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
    const units = ['piece', 'kg', 'box', 'liter', 'meter'];
    const randomUnit = units[Math.floor(Math.random() * units.length)];
    
    this.form.patchValue({
      sku: randomSku,
      name: randomName,
      slug: slugify(randomName, 128),
      internationalName: `International ${randomName}`,
      description: 'This is a randomly generated product description for testing purposes.',
      barcode: `${Math.floor(Math.random() * 1000000000000)}`,
      unit: randomUnit,
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
  protected async onSave(): Promise<void> {
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

    try {
      // Upload thumbnail if selected
      let thumbnailDto: any = undefined;
      if (this.thumbnailFile) {
        const thumbnailUrl = await this.uploadFile(
          this.thumbnailFile,
          'thumbnail',
          formValue.organizationId
        );
        thumbnailDto = {
          url: thumbnailUrl.publicUrl,
          filename: this.thumbnailFile.name,
          contentType: this.thumbnailFile.type,
          size: this.thumbnailFile.size,
          minioObjectKey: thumbnailUrl.objectKey,
          minioBucket: thumbnailUrl.bucket,
        };
      }

      // Upload media files if any
      const mediaDto: any[] = [];
      const mediaFiles = this.mediaFiles();
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const mediaUrl = await this.uploadFile(
          file,
          'media',
          formValue.organizationId
        );
        const fileType = file.type.startsWith('image/') ? 'image' : 
                        file.type.startsWith('video/') ? 'video' : 'document';
        mediaDto.push({
          type: fileType,
          url: mediaUrl.publicUrl,
          title: file.name,
          mimeType: file.type,
          size: file.size,
          order: i,
          isPrimary: i === 0,
          minioObjectKey: mediaUrl.objectKey,
          minioBucket: mediaUrl.bucket,
        });
      }

      // Build category object if categoryId is selected
      let category: any = undefined;
      if (formValue.categoryId && formValue.categoryName) {
        const selectedCategory = this.categoryOptions().find(c => c.value === formValue.categoryId);
        category = {
          id: formValue.categoryId,
          name: formValue.categoryName,
          code: selectedCategory?.code,
        };
      }

      // Build DTO matching backend expectations
      const dto: any = {
        scope: formValue.scope,
        organizationId: formValue.organizationId || undefined,
        sku: formValue.sku,
        name: formValue.name,
        slug: formValue.slug || undefined,
        internationalName: formValue.internationalName || undefined,
        description: formValue.description || undefined,
        type: formValue.type,
        status: formValue.status,
        unit: formValue.unit,
        barcode: formValue.barcode || undefined,
        thumbnail: thumbnailDto,
        media: mediaDto.length > 0 ? mediaDto : undefined,
        category,
      };

      // Create product via API
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
    } catch (error: any) {
      console.error('Upload failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productForm.messages.error'),
        detail: error?.message || this.translocoService.translate('productForm.messages.uploadFailed'),
      });
      this.isLoading.set(false);
    }
  }

  /**
   * Upload file to MinIO using presigned URL
   */
  private async uploadFile(
    file: File,
    type: 'thumbnail' | 'media',
    organizationId?: string
  ): Promise<{ publicUrl: string; objectKey: string; bucket: string }> {
    // Get presigned URL from backend
    const presignData = await this.productService
      .getPresignedUploadUrl(file.name, file.type, type, organizationId)
      .toPromise();

    if (!presignData) {
      throw new Error('Failed to get presigned upload URL');
    }

    // Upload file to MinIO using presigned URL
    await this.productService.uploadFileToPresignedUrl(presignData.uploadUrl, file).toPromise();

    // Return the public URL and object info
    return {
      publicUrl: presignData.uploadUrl.split('?')[0], // Remove query params to get public URL
      objectKey: presignData.objectKey,
      bucket: presignData.bucket,
    };
  }

  /**
   * Trigger media file input
   */
  protected onSelectMedia(): void {
    this.mediaInput?.nativeElement?.click();
  }

  /**
   * Handle media file selection
   */
  protected onMediaSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB per file
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!validTypes.includes(file.type)) {
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('productForm.messages.error'),
          detail: `${file.name}: ${this.translocoService.translate('productForm.messages.invalidMediaType')}`,
        });
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('productForm.messages.error'),
          detail: `${file.name}: ${this.translocoService.translate('productForm.messages.mediaTooLarge')}`,
        });
        continue;
      }

      newFiles.push(file);
    }

    // Add valid files to the list
    if (newFiles.length > 0) {
      this.mediaFiles.update(files => [...files, ...newFiles]);
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate('productForm.messages.success'),
        detail: this.translocoService.translate('productForm.messages.mediaAdded', { count: newFiles.length }),
      });
    }

    // Clear input
    input.value = '';
  }

  /**
   * Remove media file from list
   */
  protected onRemoveMedia(index: number): void {
    this.mediaFiles.update(files => files.filter((_, i) => i !== index));
  }

  /**
   * Get file type icon
   */
  protected getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) {
      return 'pi-image';
    } else if (file.type.startsWith('video/')) {
      return 'pi-video';
    } else {
      return 'pi-file';
    }
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
