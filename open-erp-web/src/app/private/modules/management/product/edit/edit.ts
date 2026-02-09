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
  computed,
  effect,
  Renderer2,
  DOCUMENT,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
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
} from '../../../../../../core/services/product/product.service';
import { ProductTypeService } from '../../../../../../core/services/product-type/product-type.service';
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { FileApiService, OnlyOfficeSessionConfig } from '../../../../../../core/services/file-service';
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
    DialogModule,
    Select,
    DividerModule,
    TooltipModule,
    TabsModule,
    InputNumberModule,
  ],
  templateUrl: './edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEdit implements OnInit, OnDestroy {
  @ViewChild('thumbnailInput') thumbnailInput?: ElementRef<HTMLInputElement>;
  @ViewChild('mediaInput') mediaInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly productTypeService = inject(ProductTypeService);
  private readonly productCategoryService = inject(ProductCategoryService);
  private readonly organizationContext = inject(OrganizationContextService);
  private readonly fileApiService = inject(FileApiService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

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

  // OnlyOffice state
  protected readonly onlyOfficeConfig = signal<OnlyOfficeSessionConfig | null>(null);
  protected readonly showOnlyOfficeEditor = signal(false);
  /** 'drawer' = side panel (default), 'fullscreen' = maximized dialog, 'detached' = new browser tab */
  protected readonly onlyOfficeViewMode = signal<'drawer' | 'fullscreen' | 'detached'>('drawer');
  private onlyOfficeEditorInstance: any = null;
  private onlyOfficeScriptLoaded = false;
  private detachedWindow: Window | null = null;

  /** MS Office MIME types supported for upload */
  private readonly officeMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

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
      slug: product.slug || '',
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
      
      // Dimensions from product.dimensions (not metadata)
      weight: product.dimensions?.weight || null,
      length: product.dimensions?.length || null,
      width: product.dimensions?.width || null,
      height: product.dimensions?.height || null,
      
      // Storage conditions from product.storageConditions (not metadata)
      storageConditions: product.storageConditions?.specialInstructions || '',
      
      // Expiry from product.shelfLifeDays (not metadata)
      expiryDays: product.shelfLifeDays || null,
      
      // Keep metadata for any custom fields
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
    } else {
      this.mediaFiles.set([]);
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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
   * Check if a media file is a Microsoft Office document supported by OnlyOffice
   */
  protected isOfficeFile(mediaFile: MediaFile): boolean {
    if (!mediaFile.filename) return false;
    const dotIndex = mediaFile.filename.lastIndexOf('.');
    if (dotIndex === -1) return false;
    const ext = mediaFile.filename.substring(dotIndex).toLowerCase();
    return ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext);
  }

  /**
   * Open OnlyOffice editor for a media file
   */
  protected async onOpenOnlyOffice(mediaFile: MediaFile, mode: 'view' | 'edit' = 'view'): Promise<void> {
    if (!mediaFile.minioObjectKey || !mediaFile.filename) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: this.translocoService.translate('productEdit.messages.onlyOfficeNoFile'),
      });
      return;
    }

    try {
      const sessionConfig = await firstValueFrom(
        this.fileApiService.createOnlyOfficeSession({
          minioKey: mediaFile.minioObjectKey,
          bucket: mediaFile.minioBucket,
          filename: mediaFile.filename,
          mode,
        })
      );

      this.onlyOfficeConfig.set(sessionConfig);
      this.showOnlyOfficeEditor.set(true);

      // Wait for DOM to update then initialize editor
      this.waitForEditorContainer().then(() => this.initOnlyOfficeEditor());
    } catch (err: any) {
      console.error('Failed to create OnlyOffice session:', err);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: err?.error?.message || this.translocoService.translate('productEdit.messages.onlyOfficeFailed'),
      });
    }
  }

  /**
   * Switch OnlyOffice view mode
   */
  protected onSwitchOnlyOfficeMode(mode: 'drawer' | 'fullscreen' | 'detached'): void {
    const config = this.onlyOfficeConfig();
    if (!config) return;

    if (mode === 'detached') {
      this.openDetachedWindow(config);
      return;
    }

    // Destroy current editor instance before switching
    this.destroyOnlyOfficeEditor();
    this.onlyOfficeViewMode.set(mode);

    // Re-initialize editor in the new container
    this.waitForEditorContainer().then(() => this.initOnlyOfficeEditor());
  }

  /**
   * Sanitize a string for safe insertion into HTML
   */
  private escapeHtml(str: string): string {
    const div = this.document.createElement('div');
    div.appendChild(this.document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Open OnlyOffice in a detached browser window
   */
  private openDetachedWindow(config: OnlyOfficeSessionConfig): void {
    // Close previous detached window if open
    if (this.detachedWindow && !this.detachedWindow.closed) {
      this.detachedWindow.close();
    }

    const w = window.open('', '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (!w) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: this.translocoService.translate('productEdit.onlyOffice.popupBlocked'),
      });
      return;
    }
    this.detachedWindow = w;

    const title = this.escapeHtml(config.config?.['document']?.['title'] || 'Document Editor');
    const safeEditorUrl = this.escapeHtml(config.editorUrl);
    w.document.write(`<!DOCTYPE html>
<html><head><title>${title}</title>
<style>html,body{margin:0;padding:0;height:100%;overflow:hidden;}#editor{height:100%;}</style>
</head><body><div id="editor"></div>
<script src="${safeEditorUrl}"><\/script>
<script>
  new DocsAPI.DocEditor("editor", ${JSON.stringify(config.config)});
<\/script></body></html>`);
    w.document.close();

    // Close the inline editor panel
    this.destroyOnlyOfficeEditor();
    this.showOnlyOfficeEditor.set(false);
  }

  /**
   * Wait for the editor container element to be present in the DOM
   */
  private waitForEditorContainer(maxAttempts = 20): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        if (this.document.getElementById('onlyoffice-editor-container') || attempts >= maxAttempts) {
          resolve();
        } else {
          attempts++;
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });
  }

  /**
   * Load the OnlyOffice Document Server API script
   */
  private loadOnlyOfficeScript(editorUrl: string): Promise<void> {
    if (this.onlyOfficeScriptLoaded && (window as any).DocsAPI) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = this.renderer.createElement('script');
      script.src = editorUrl;
      script.type = 'text/javascript';
      script.onload = () => {
        this.onlyOfficeScriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load OnlyOffice API script'));
      this.renderer.appendChild(this.document.body, script);
    });
  }

  /**
   * Initialize the OnlyOffice editor in the container element
   */
  private async initOnlyOfficeEditor(): Promise<void> {
    const config = this.onlyOfficeConfig();
    if (!config) return;

    try {
      await this.loadOnlyOfficeScript(config.editorUrl);

      // Destroy previous instance
      this.destroyOnlyOfficeEditor();

      const DocsAPI = (window as any).DocsAPI;
      if (!DocsAPI) {
        console.error('DocsAPI not available after script load');
        return;
      }

      this.onlyOfficeEditorInstance = new DocsAPI.DocEditor(
        'onlyoffice-editor-container',
        config.config,
      );
    } catch (err) {
      console.error('Failed to initialize OnlyOffice editor:', err);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productEdit.messages.error'),
        detail: this.translocoService.translate('productEdit.messages.onlyOfficeFailed'),
      });
    }
  }

  /**
   * Destroy current OnlyOffice editor instance
   */
  private destroyOnlyOfficeEditor(): void {
    if (this.onlyOfficeEditorInstance) {
      try {
        this.onlyOfficeEditorInstance.destroyEditor();
      } catch {
        // ignore destroy errors
      }
      this.onlyOfficeEditorInstance = null;
    }
  }

  /**
   * Close OnlyOffice editor
   */
  protected onCloseOnlyOffice(): void {
    this.destroyOnlyOfficeEditor();
    if (this.detachedWindow && !this.detachedWindow.closed) {
      this.detachedWindow.close();
      this.detachedWindow = null;
    }
    this.showOnlyOfficeEditor.set(false);
    this.onlyOfficeConfig.set(null);
  }

  ngOnDestroy(): void {
    this.destroyOnlyOfficeEditor();
    if (this.detachedWindow && !this.detachedWindow.closed) {
      this.detachedWindow.close();
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
        const selectedCategory = formValue.categoryId
          ? this.categoryOptions().find((c) => c.value === formValue.categoryId)
          : undefined;

        if (formValue.categoryId && selectedCategory) {
          dto.category = {
            id: formValue.categoryId,
            name: (selectedCategory as any).label,
            code: (selectedCategory as any).code,
          };
        } else if (!formValue.categoryId && product.categoryId) {
          // Category was cleared by the user
          dto.category = null as any;
        }
      }

      // Handle dimensions changes (compare with product.dimensions, not metadata)
      const hasDimensionChanges = 
        formValue.weight !== (product.dimensions?.weight || null) ||
        formValue.length !== (product.dimensions?.length || null) ||
        formValue.width !== (product.dimensions?.width || null) ||
        formValue.height !== (product.dimensions?.height || null);

      if (hasDimensionChanges) {
        dto.dimensions = {
          weight: formValue.weight || undefined,
          // Preserve existing weight unit when present; default to 'kg' otherwise
          weightUnit: product.dimensions?.weightUnit || 'kg',
          length: formValue.length || undefined,
          width: formValue.width || undefined,
          height: formValue.height || undefined,
          // Preserve existing dimension unit when present; default to 'cm' otherwise
          unit: product.dimensions?.unit || 'cm',
        };
      }

      // Handle storage conditions changes (compare with product.storageConditions, not metadata)
      const hasStorageChanges =
        formValue.storageConditions !== (product.storageConditions?.specialInstructions || '') ||
        formValue.expiryDays !== (product.shelfLifeDays || null);

      if (hasStorageChanges) {
        dto.storageConditions = {
          specialInstructions: formValue.storageConditions || undefined,
        };
        
        if (formValue.expiryDays !== (product.shelfLifeDays || null)) {
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
        // Explicitly send null so the backend clears the existing thumbnail
        dto.thumbnail = null;
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
    // Determine if we're editing an existing product (product-scoped upload)
    const productId = this.route.snapshot.paramMap.get('id');

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
      // Navigate back to view (sibling route) and bump a query param to allow resolvers to re-run
      await this.router.navigate(['../view'], {
        relativeTo: this.route,
        queryParams: { refresh: Date.now() },
        queryParamsHandling: 'merge',
      });
    } finally {
      this.isVisible.set(false);
    }
  }
}
