import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  DestroyRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

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
  UpdateProductDto,
  RegisterMediaDto,
  ThumbnailDto,
} from '../../../../../../core/services/product/product.service';
import { ProductTypeService } from '../../../../../../core/services/product-type/product-type.service';
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { PRODUCT_STATUS_OPTIONS, PRODUCT_UNIT_OPTIONS } from '../../../../../../core/constants/ui.constants';

interface SelectOption {
  label: string;
  value: string;
  code?: string;
  name?: string;
}

interface CategorySelectOption extends SelectOption {
  code: string;
  name: string;
}

interface MediaFile {
  file?: File;
  url: string;
  filename: string;
  type: 'image' | 'video' | 'document';
  size?: number;
  uploadedAt?: string;
  minioObjectKey?: string;
  minioBucket?: string;
  isExisting: boolean;
  isMarkedForDeletion: boolean;
}

@Component({
  selector: 'management-product-edit',
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
  templateUrl: './edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEdit implements OnInit {
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
  protected readonly originalProduct = signal<Product | null>(null);
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly thumbnailPreview = signal<string | null>(null);
  protected readonly activeTabIndex = signal<number>(0);
  protected readonly ProductScope = ProductScope;
  protected readonly ProductStatus = ProductStatus;

  // Media state
  protected readonly mediaFiles = signal<MediaFile[]>([]);
  protected newThumbnailFile: File | null = null;
  protected thumbnailMarkedForDeletion = false;

  // Dropdown options (imported from constants)
  protected readonly statusOptions = PRODUCT_STATUS_OPTIONS;
  protected readonly unitOptions = PRODUCT_UNIT_OPTIONS;

  protected typeOptions = signal<SelectOption[]>([]);
  protected categoryOptions = signal<CategorySelectOption[]>([]);

  protected form!: FormGroup;

  // Computed permissions
  protected readonly canEdit = computed(() => {
    // TODO: Implement actual permission check
    return true;
  });

  ngOnInit(): void {
    // Initialize form
    this.form = this.fb.group({
      // Read-only fields (unique)
      sku: [{ value: '', disabled: true }],
      barcode: [{ value: '', disabled: true }],
      slug: [{ value: '', disabled: true }],
      scope: [{ value: '', disabled: true }],
      organizationId: [{ value: '', disabled: true }],

      // Editable fields
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      status: [ProductStatus.DRAFT, [Validators.required]],
      internationalName: ['', [Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      type: ['', [Validators.required]],
      categoryId: [''],
      categoryName: [''],
      unit: ['piece', [Validators.required]],

      // Dimensions
      weight: [null],
      length: [null],
      width: [null],
      height: [null],

      // Storage conditions
      storageConditions: ['', [Validators.maxLength(500)]],
      expiryDays: [null],

      // Warehouse settings
      warehouseSettings: [{}],

      // Custom fields
      metadata: [{}],
    });

    // Load dropdown data
    this.loadProductTypes();
    this.loadProductCategories();

    // Load product data from resolver
    this.route.data.subscribe((data) => {
      const product = data['product'] as Product;
      if (product) {
        this.product.set(product);
        this.originalProduct.set(JSON.parse(JSON.stringify(product))); // Deep copy
        this.populateForm(product);
        this.loadExistingMedia(product);
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
        const options: CategorySelectOption[] = result.items.map((cat) => ({
          label: cat.name,
          value: cat.id,
          code: cat.code || '',
          name: cat.name,
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
      // Read-only fields
      sku: product.sku,
      barcode: product.barcode || '',
      slug: product.metadata?.['slug'] || '',
      scope: product.scope,
      organizationId: product.organizationId || '',

      // Editable fields
      name: product.name,
      status: product.status,
      internationalName: product.internationalName || '',
      description: product.description || '',
      type: product.type,
      categoryId: product.categoryId || '',
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

    // Set thumbnail preview
    if (product.thumbnail?.url) {
      this.thumbnailPreview.set(product.thumbnail.url);
    }
  }

  /**
   * Load existing media files from product
   */
  private loadExistingMedia(product: Product): void {
    if (product.media && product.media.length > 0) {
      const mediaFiles: MediaFile[] = product.media.map((media) => ({
        url: media.url,
        filename: media.title || 'Untitled',
        type: media.type,
        size: media.size,
        minioObjectKey: media.minioObjectKey,
        minioBucket: media.minioBucket,
        isExisting: true,
        isMarkedForDeletion: false,
      }));
      this.mediaFiles.set(mediaFiles);
    }
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
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: this.translocoService.translate('productEdit.messages.invalidFileType'),
      });
      input.value = '';
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: this.translocoService.translate('productEdit.messages.fileTooLarge'),
      });
      input.value = '';
      return;
    }

    // Store the file for later upload
    this.newThumbnailFile = file;
    this.thumbnailMarkedForDeletion = false;

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
   * Clear/remove thumbnail
   */
  protected onClearThumbnail(): void {
    this.thumbnailPreview.set(null);
    this.newThumbnailFile = null;
    this.thumbnailMarkedForDeletion = true;
    if (this.thumbnailInput?.nativeElement) {
      this.thumbnailInput.nativeElement.value = '';
    }
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
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB per file
    const newMediaFiles: MediaFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!validTypes.includes(file.type)) {
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('productEdit.messages.error'),
          detail: `${file.name}: ${this.translocoService.translate('productEdit.messages.invalidMediaType')}`,
        });
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('productEdit.messages.error'),
          detail: `${file.name}: ${this.translocoService.translate('productEdit.messages.mediaTooLarge')}`,
        });
        continue;
      }

      const fileType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'document';

      newMediaFiles.push({
        file,
        url: URL.createObjectURL(file),
        filename: file.name,
        type: fileType as 'image' | 'video' | 'document',
        size: file.size,
        isExisting: false,
        isMarkedForDeletion: false,
      });
    }

    // Add valid files to the list
    if (newMediaFiles.length > 0) {
      this.mediaFiles.update((files) => [...files, ...newMediaFiles]);
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate('productEdit.messages.success'),
        detail: this.translocoService.translate('productEdit.messages.mediaAdded', {
          count: newMediaFiles.length,
        }),
      });
    }

    // Clear input
    input.value = '';
  }

  /**
   * Mark media file for deletion or remove from list
   */
  protected onRemoveMedia(index: number): void {
    const media = this.mediaFiles()[index];

    if (media.isExisting) {
      // Mark existing media for deletion
      this.mediaFiles.update((files) =>
        files.map((f, i) => (i === index ? { ...f, isMarkedForDeletion: true } : f))
      );
    } else {
      // Remove new media from list
      this.mediaFiles.update((files) => files.filter((_, i) => i !== index));
    }
  }

  /**
   * Undo removal of existing media
   */
  protected onRestoreMedia(index: number): void {
    this.mediaFiles.update((files) =>
      files.map((f, i) => (i === index ? { ...f, isMarkedForDeletion: false } : f))
    );
  }

  /**
   * Get file type icon
   */
  protected getFileIcon(mediaFile: MediaFile): string {
    if (mediaFile.type === 'image') {
      return 'pi-image';
    } else if (mediaFile.type === 'video') {
      return 'pi-video';
    } else {
      return 'pi-file';
    }
  }

  /**
   * Reset form to original product data
   */
  protected onReset(): void {
    const original = this.originalProduct();
    if (original) {
      this.populateForm(original);
      this.loadExistingMedia(original);
      this.newThumbnailFile = null;
      this.thumbnailMarkedForDeletion = false;
      this.messageService.add({
        severity: 'info',
        summary: this.translocoService.translate('productEdit.messages.reset'),
        detail: this.translocoService.translate('productEdit.messages.resetDetail'),
      });
    }
  }

  /**
   * Handle media deletions
   */
  private async handleMediaDeletions(productId: string): Promise<void> {
    const mediaToDelete = this.mediaFiles().filter((m) => m.isExisting && m.isMarkedForDeletion);
    for (const media of mediaToDelete) {
      if (media.minioObjectKey) {
        await firstValueFrom(this.productService.deleteProductMedia(productId, media.minioObjectKey));
      }
    }
  }

  /**
   * Handle new media uploads
   */
  private async handleMediaUploads(productId: string, organizationId?: string): Promise<void> {
    const newMedia = this.mediaFiles().filter((m) => !m.isExisting && !m.isMarkedForDeletion);
    for (const mediaFile of newMedia) {
      if (mediaFile.file) {
        const mediaUrl = await this.uploadFile(mediaFile.file, 'media', organizationId);
        
        // Register media with product - use correct field names per backend DTO
        await firstValueFrom(
          this.productService.registerProductMedia(productId, {
            objectKey: mediaUrl.objectKey,
            type: mediaFile.type,
            url: mediaUrl.publicUrl,
            filename: mediaFile.filename,
            contentType: mediaFile.file.type,
            size: mediaFile.file.size,
            title: mediaFile.filename,
          })
        );
      }
    }
  }

  /**
   * Save as draft
   */
  protected onSaveDraft(): void {
    this.form.patchValue({ status: ProductStatus.DRAFT });
    this.onSave();
  }

  /**
   * Save form (update product)
   */
  protected async onSave(): Promise<void> {
    if (!this.canEdit()) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: this.translocoService.translate('productEdit.messages.noPermission'),
      });
      return;
    }

    // Mark all fields as touched to show validation errors
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control?.invalid && !control.disabled) {
        control.markAsTouched();
      }
    });

    if (this.form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: this.translocoService.translate('productEdit.messages.validationFailed'),
      });
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();
    const product = this.product();

    if (!product) {
      this.isLoading.set(false);
      return;
    }

    try {
      // Build update DTO with only changed fields
      const dto: UpdateProductDto = {};

      // Check basic fields
      if (formValue.name !== product.name) dto.name = formValue.name;
      if (formValue.status !== product.status) dto.status = formValue.status;
      if (formValue.internationalName !== (product.internationalName || ''))
        dto.internationalName = formValue.internationalName || undefined;
      if (formValue.description !== (product.description || ''))
        dto.description = formValue.description || undefined;
      if (formValue.type !== product.type) dto.type = formValue.type;
      if (formValue.unit !== product.unit) dto.unit = formValue.unit;

      // Handle category
      if (formValue.categoryId !== (product.categoryId || '')) {
        if (formValue.categoryId && formValue.categoryName) {
          const selectedCategory = this.categoryOptions().find((c) => c.value === formValue.categoryId);
          dto.category = {
            id: formValue.categoryId,
            name: formValue.categoryName,
            code: selectedCategory?.code,
          };
        }
      }

      // Handle dimensions changes
      const currentDimensions = product.metadata?.['dimensions'] || {};
      const hasDimensionChanges = 
        formValue.weight !== (product.metadata?.['weight'] || null) ||
        formValue.length !== (product.metadata?.['length'] || null) ||
        formValue.width !== (product.metadata?.['width'] || null) ||
        formValue.height !== (product.metadata?.['height'] || null);

      if (hasDimensionChanges) {
        dto.dimensions = {
          weight: formValue.weight || undefined,
          weightUnit: 'kg',
          length: formValue.length || undefined,
          width: formValue.width || undefined,
          height: formValue.height || undefined,
          unit: 'cm',
        };
      }

      // Handle storage conditions changes
      const hasStorageChanges =
        formValue.storageConditions !== (product.metadata?.['storageConditions'] || '') ||
        formValue.expiryDays !== (product.metadata?.['expiryDays'] || null);

      if (hasStorageChanges) {
        dto.storageConditions = {
          specialInstructions: formValue.storageConditions || undefined,
        };
        
        if (formValue.expiryDays !== (product.metadata?.['expiryDays'] || null)) {
          dto.shelfLifeDays = formValue.expiryDays || undefined;
          dto.hasExpiryDate = formValue.expiryDays !== null && formValue.expiryDays > 0;
        }
      }

      // Handle thumbnail upload/deletion
      if (this.newThumbnailFile) {
        const thumbnailUrl = await this.uploadFile(
          this.newThumbnailFile,
          'thumbnail',
          product.organizationId
        );
        dto.thumbnail = {
          url: thumbnailUrl.publicUrl,
          filename: this.newThumbnailFile.name,
          contentType: this.newThumbnailFile.type,
          size: this.newThumbnailFile.size,
          minioObjectKey: thumbnailUrl.objectKey,
          minioBucket: thumbnailUrl.bucket,
        };
      } else if (this.thumbnailMarkedForDeletion) {
        dto.thumbnail = undefined;
      }

      // Handle media operations
      await this.handleMediaDeletions(product.id);
      await this.handleMediaUploads(product.id, product.organizationId);

      // Update product if there are changes
      if (Object.keys(dto).length > 0) {
        const updated = await firstValueFrom(this.productService.updateProduct(product.id, dto));
        if (updated) {
          this.product.set(updated);
          this.originalProduct.set(JSON.parse(JSON.stringify(updated)));
        }
      }

      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate('productEdit.messages.success'),
        detail: this.translocoService.translate('productEdit.messages.updateSuccess'),
      });
      
      this.isLoading.set(false);
      this.onClose();
    } catch (error: any) {
      console.error('Save failed:', error);
      
      // Handle 403 Forbidden
      if (error?.status === 403) {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productEdit.messages.error'),
          detail: this.translocoService.translate('productEdit.messages.forbidden'),
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productEdit.messages.error'),
          detail:
            error?.error?.message ||
            this.translocoService.translate('productEdit.messages.saveFailed'),
        });
      }
      
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
    const presignData = await firstValueFrom(
      this.productService.getPresignedUploadUrl(file.name, file.type, type, organizationId)
    );

    if (!presignData) {
      throw new Error('Failed to get presigned upload URL');
    }

    // Upload file to MinIO using presigned URL
    await firstValueFrom(this.productService.uploadFileToPresignedUrl(presignData.uploadUrl, file));

    // Return the public URL and object info
    return {
      publicUrl: presignData.uploadUrl.split('?')[0], // Remove query params to get public URL
      objectKey: presignData.objectKey,
      bucket: presignData.bucket,
    };
  }

  /**
   * Close form and navigate back
   */
  protected async onClose(): Promise<void> {
    try {
      // Navigate back to view (sibling route)
      await this.router.navigate(['../view'], { relativeTo: this.route });
    } finally {
      this.isVisible.set(false);
    }
  }
}
