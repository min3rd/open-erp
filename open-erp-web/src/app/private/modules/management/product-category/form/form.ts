import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, effect } from '@angular/core';
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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumber } from 'primeng/inputnumber';

// Core services
import {
  ProductCategoryService,
  ProductCategory,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from '../../../../../../core/services/product-category/product-category.service';

interface ParentCategoryOption {
  label: string;
  value: string;
}

@Component({
  selector: 'management-product-category-form',
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
    InputNumber,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCategoryForm implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productCategoryService = inject(ProductCategoryService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly productCategory = signal<ProductCategory | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly isViewMode = signal(false);
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly parentCategoryOptions = signal<ParentCategoryOption[]>([]);

  protected form!: FormGroup;

  constructor() {
    // Effect to ensure drawer is visible when form is loaded
    effect(() => {
      // When productCategory changes, ensure drawer is visible
      const category = this.productCategory();
      if (category || this.isEditMode() || this.isViewMode()) {
        this.isVisible.set(true);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    // Initialize form
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      parentId: [null],
      description: ['', Validators.maxLength(500)],
      isActive: [true],
      order: [0, [Validators.min(0)]],
      metadata: [''],
    });

    // Determine mode from route
    const routePath = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.isViewMode.set(routePath === 'view');
    this.isEditMode.set(routePath === 'edit');

    // Load data from route resolver
    this.route.data.subscribe((data) => {
      const productCategory = data['productCategory'] as ProductCategory;
      if (productCategory) {
        this.productCategory.set(productCategory);

        // Populate form from product category data
        this.form.patchValue({
          code: productCategory.code,
          name: productCategory.name,
          parentId: productCategory.parentId || null,
          description: productCategory.description || '',
          isActive: productCategory.isActive,
          order: productCategory.order || 0,
          metadata: productCategory.metadata ? JSON.stringify(productCategory.metadata, null, 2) : '',
        });

        if (this.isViewMode()) {
          this.form.disable();
        } else {
          this.form.enable();
        }

        // Force change detection
        this.cdr.detectChanges();
      }

      // Load parent categories from resolver
      const parentCategories = data['parentCategories'] as ProductCategory[];
      if (parentCategories) {
        this.parentCategoryOptions.set(
          parentCategories.map((cat) => ({
            label: cat.name,
            value: cat.id,
          }))
        );
      }
    });
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
        summary: this.translocoService.translate('productCategoryForm.messages.error'),
        detail: this.translocoService.translate('productCategoryForm.messages.validationFailed'),
      });
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    // Parse metadata JSON if provided
    let metadata: Record<string, any> | undefined = undefined;
    if (formValue.metadata && formValue.metadata.trim()) {
      try {
        metadata = JSON.parse(formValue.metadata);
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productCategoryForm.messages.error'),
          detail: this.translocoService.translate('productCategoryForm.messages.invalidJson') + 
                  (error?.message ? `: ${error.message}` : ''),
        });
        this.isLoading.set(false);
        return;
      }
    }

    // Build DTO
    const dto: CreateProductCategoryDto | UpdateProductCategoryDto = {
      code: formValue.code,
      name: formValue.name,
      parentId: formValue.parentId || undefined,
      description: formValue.description || undefined,
      isActive: formValue.isActive,
      order: formValue.order,
      metadata,
    };

    const saveOperation = this.productCategory()
      ? this.productCategoryService.updateProductCategory(this.productCategory()!.id, dto)
      : this.productCategoryService.createProductCategory(dto as CreateProductCategoryDto);

    saveOperation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('productCategoryForm.messages.success'),
          detail: this.translocoService.translate(
            this.productCategory()
              ? 'productCategoryForm.messages.updateSuccess'
              : 'productCategoryForm.messages.createSuccess'
          ),
        });
        this.onClose();
      },
      error: (error: any) => {
        console.error('Save failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productCategoryForm.messages.error'),
          detail: error?.error?.message || this.translocoService.translate('productCategoryForm.messages.saveFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to list - use relative navigation to parent
    if (this.productCategory()) {
      // For edit/view mode: go up 2 levels (../../)
      this.router.navigate(['../..'], { relativeTo: this.route });
    } else {
      // For new mode: go up 1 level (../)
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
