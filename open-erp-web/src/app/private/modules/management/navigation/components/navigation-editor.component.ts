import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  inject,
  OnInit,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG imports
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { PanelModule } from 'primeng/panel';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AutoCompleteModule } from 'primeng/autocomplete';

// DTOs
import {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
} from '../dto/navigation-item.dto';

// Utilities
import { slugify } from '../../../../../../core/utils/slugify';

interface IconOption {
  name: string;
  label: string;
  category: string;
}

@Component({
  selector: 'app-navigation-editor',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslocoModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    InputNumberModule,
    ButtonModule,
    ChipModule,
    PanelModule,
    FloatLabelModule,
    AutoCompleteModule,
  ],
  templateUrl: './navigation-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationEditorComponent implements OnInit {
  // Inputs
  readonly item = input<NavigationItemDto | null>(null);
  readonly mode = input<'create' | 'edit' | 'view'>('create');
  readonly availableModules = input<{ label: string; value: string }[]>([]);
  readonly availableParents = input<NavigationItemDto[]>([]);
  // Context inputs for auto-filling form based on user context
  readonly defaultScope = input<'global' | 'module'>('global');
  readonly defaultModule = input<string | null>(null);

  protected readonly filteredParents = computed(() => {
    const parents = this.availableParents();
    const currentId = this.item()?.id;
    if (!currentId) return parents;
    return parents.filter((p) => p.id !== currentId);
  });

  // Outputs
  readonly formValid = output<boolean>();
  readonly formData = output<CreateNavigationItemDto | UpdateNavigationItemDto>();

  private fb = inject(FormBuilder);
  private translocoService = inject(TranslocoService);
  private http = inject(HttpClient);

  // Form
  protected readonly form = signal<FormGroup>(this.createForm());
  protected readonly isSubmitting = signal(false);

  // ID field state
  protected readonly isAutoGeneratingId = signal(true);
  protected readonly idPreview = signal('');
  protected readonly isCheckingIdUniqueness = signal(false);
  protected readonly idUniquenessError = signal<string | null>(null);

  // Icons
  protected readonly availableIcons = signal<IconOption[]>([]);
  protected readonly filteredIcons = signal<IconOption[]>([]);

  // Options
  protected readonly scopeOptions = [
    { label: 'navigationManagement.editor.form.scope.global', value: 'global' },
    { label: 'navigationManagement.editor.form.scope.module', value: 'module' },
  ];

  protected readonly tooltipPositionOptions = [
    { label: 'navigationManagement.editor.form.tooltipPosition.top', value: 'top' },
    { label: 'navigationManagement.editor.form.tooltipPosition.bottom', value: 'bottom' },
    { label: 'navigationManagement.editor.form.tooltipPosition.left', value: 'left' },
    { label: 'navigationManagement.editor.form.tooltipPosition.right', value: 'right' },
  ];

  // Permissions
  protected readonly includePermissions = signal<string[]>([]);
  protected readonly excludePermissions = signal<string[]>([]);

  constructor() {
    // Update form when item changes
    effect(() => {
      const currentItem = this.item();
      if (currentItem && this.mode() !== 'create') {
        this.patchForm(currentItem);
      }
    });

    // Watch scope changes to toggle moduleId required
    effect(() => {
      const formValue = this.form().value;
      if (formValue.scope === 'module') {
        this.form().get('moduleId')?.setValidators([Validators.required]);
      } else {
        this.form().get('moduleId')?.clearValidators();
      }
      this.form().get('moduleId')?.updateValueAndValidity();
    });

    // Watch label changes to auto-generate ID
    effect(() => {
      const formValue = this.form().value;
      const label = formValue.label;
      const currentMode = this.mode();
      
      // Only auto-generate in create mode or when explicitly enabled
      if (this.isAutoGeneratingId() && label && currentMode === 'create') {
        const generatedId = slugify(label, 128);
        this.idPreview.set(generatedId);
        
        // Update the form control without triggering user edit
        const idControl = this.form().get('id');
        if (idControl) {
          idControl.setValue(generatedId, { emitEvent: false });
        }
      } else if (this.isAutoGeneratingId() && label && currentMode !== 'create') {
        // In edit mode with auto-generation enabled, still update preview but don't change the form
        const generatedId = slugify(label, 128);
        this.idPreview.set(generatedId);
      } else if (!label) {
        this.idPreview.set('');
      } else {
        // Update preview with current ID value when not auto-generating
        const currentId = this.form().get('id')?.value;
        if (currentId) {
          this.idPreview.set(currentId);
        }
      }
    });
  }

  ngOnInit(): void {
    // Load icons
    this.loadIcons();

    const currentItem = this.item();
    if (currentItem && this.mode() !== 'create') {
      this.patchForm(currentItem);
    } else if (this.mode() === 'create') {
      // In create mode, apply default values based on context
      const scope = this.defaultScope();
      const module = this.defaultModule();

      this.form().patchValue({
        scope: scope,
        module: module || '',
      });

      // If creating in global context, disable scope field
      if (scope === 'global') {
        this.form().get('scope')?.disable();
      }

      // If creating in module context, set moduleId and make it required
      if (scope === 'module' && module) {
        this.form().get('module')?.setValue(module);
        this.form().get('module')?.disable();
      }
    }

    // Disable form in view mode only (not in create mode)
    if (this.mode() === 'view') {
      this.form().disable();
    } else if (this.mode() !== 'create') {
      // Ensure form is enabled in edit mode
      this.form().enable();
    }

    // Emit form validity and data on changes
    this.form().valueChanges.subscribe(() => {
      this.formValid.emit(this.form().valid);
      if (this.form().valid) {
        this.formData.emit(this.buildDto());
      }
    });

    // Emit initial state
    this.formValid.emit(this.form().valid);
    if (this.form().valid) {
      this.formData.emit(this.buildDto());
    }
  }

  /**
   * Load icons from JSON file
   */
  private loadIcons(): void {
    this.http.get<IconOption[]>('/data/common/icons.json').subscribe({
      next: (icons) => {
        this.availableIcons.set(icons);
        this.filteredIcons.set(icons);
      },
      error: (error) => {
        console.error('Failed to load icons:', error);
      },
    });
  }

  /**
   * Filter icons based on search query
   */
  protected filterIcons(event: any): void {
    const query = event.query.toLowerCase();
    const allIcons = this.availableIcons();

    if (!query) {
      this.filteredIcons.set(allIcons);
    } else {
      const filtered = allIcons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(query) ||
          icon.label.toLowerCase().includes(query) ||
          icon.category.toLowerCase().includes(query)
      );
      this.filteredIcons.set(filtered);
    }
  }

  /**
   * Create the form group
   */
  private createForm(): FormGroup {
    return this.fb.group({
      id: [
        '',
        [
          Validators.required,
          Validators.maxLength(128),
          Validators.pattern(/^[a-z0-9\-_]+$/),
        ],
      ],
      label: ['', [Validators.required]],
      icon: [''],
      subtitle: [''],
      routerLink: ['/'],
      url: [''],
      scope: ['global', [Validators.required]],
      moduleId: [''],
      order: [0],
      disabled: [false],
      target: [''],
      badge: [''],
      badgeClass: [''],
      tooltip: [''],
      shortcut: [''],
      class: [''],
      command: [''],
      meta: [''],
      parentId: [null],
    });
  }

  /**
   * Patch form with item data
   */
  private patchForm(item: NavigationItemDto): void {
    // When editing an existing item, disable auto-generation
    this.isAutoGeneratingId.set(false);
    
    this.form().patchValue({
      id: item.id,
      label: item.label,
      icon: item.icon || '',
      subtitle: item.subtitle || '',
      routerLink: Array.isArray(item.routerLink)
        ? item.routerLink.join('/')
        : item.routerLink || '',
      url: item.url || '',
      scope: item.scope,
      moduleId: item.moduleId || '',
      order: item.order,
      disabled: item.disabled || false,
      target: item.target || '',
      badge: item.badge || '',
      badgeClass: item.badgeClass || '',
      tooltip: item.tooltip || '',
      shortcut: item.shortcut || '',
      class: item.class || '',
      command: item.command || '',
      meta: item.meta ? JSON.stringify(item.meta, null, 2) : '',
    });

    // Set permissions
    if (item.permissions?.include) {
      this.includePermissions.set([...item.permissions.include]);
    }
    if (item.permissions?.exclude) {
      this.excludePermissions.set([...item.permissions.exclude]);
    }
    
    // Update ID preview
    this.idPreview.set(item.id);
    // Set parentId if it exists (for compatibility with new field)
    if (item.parentId) {
      this.form().patchValue({ parentId: item.parentId });
    }  }

  /**
   * Handle form submission
   */
  /**
   * Build DTO from form values
   */
  private buildDto(): CreateNavigationItemDto | UpdateNavigationItemDto {
    const formValue = this.form().value;

    // Normalize routerLink to string (backend expects a string path)
    let normalizedRouterLink: string | undefined;
    if (formValue.routerLink) {
      const parts = String(formValue.routerLink).split('/').filter(Boolean);
      normalizedRouterLink = parts.length ? `/${parts.join('/')}` : undefined;
    }

    // Extract icon name from object if needed (AutoComplete binds the whole object)
    let iconName: string | undefined;
    if (formValue.icon) {
      if (typeof formValue.icon === 'string') {
        iconName = formValue.icon;
      } else if (typeof formValue.icon === 'object' && formValue.icon.name) {
        iconName = formValue.icon.name;
      }
    }

    const dto: any = {
      id: formValue.id,
      label: formValue.label,
      icon: iconName || undefined,
      subtitle: formValue.subtitle || undefined,
      // backend expects string routerLink
      routerLink: normalizedRouterLink,
      url: formValue.url || undefined,
      scope: formValue.scope || this.defaultScope() || undefined,
      moduleId: formValue.moduleId || this.defaultModule() || undefined,
      order: formValue.order || 0,
      disabled: formValue.disabled || false,
      target: formValue.target || undefined,
      badge: formValue.badge || undefined,
      badgeClass: formValue.badgeClass || undefined,
      tooltip: formValue.tooltip || undefined,
      shortcut: formValue.shortcut || undefined,
      class: formValue.class || undefined,
      command: formValue.command || undefined,
      parentId: formValue.parentId || undefined,
      permissions: {
        include: this.includePermissions().length > 0 ? this.includePermissions() : undefined,
        exclude: this.excludePermissions().length > 0 ? this.excludePermissions() : undefined,
      },
    } as CreateNavigationItemDto | UpdateNavigationItemDto;

    // Parse metadata if provided
    if (formValue.meta) {
      try {
        dto.meta = JSON.parse(formValue.meta);
      } catch (e) {
        console.error('Invalid JSON in meta field:', e);
      }
    }

    return dto;
  }

  /**
   * Get form control error message
   */
  protected getErrorMessage(controlName: string): string {
    const control = this.form().get(controlName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return this.translocoService.translate(`navigationManagement.editor.form.${controlName}.errors.required`);
    }
    if (control.errors['email']) {
      return this.translocoService.translate('navigationManagement.validation.invalidUrl');
    }
    if (control.errors['pattern']) {
      return this.translocoService.translate(`navigationManagement.editor.form.${controlName}.errors.pattern`);
    }
    if (control.errors['maxlength']) {
      return this.translocoService.translate(`navigationManagement.editor.form.${controlName}.errors.maxlength`);
    }

    return '';
  }

  /**
   * Check if field has error
   */
  protected hasError(controlName: string): boolean {
    const control = this.form().get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Add permission to include list
   */
  protected onAddIncludePermission(value: string): void {
    if (value && !this.includePermissions().includes(value)) {
      this.includePermissions.update((perms) => [...perms, value]);
    }
  }

  /**
   * Remove permission from include list
   */
  protected onRemoveIncludePermission(value: string): void {
    this.includePermissions.update((perms) => perms.filter((p) => p !== value));
  }

  /**
   * Add permission to exclude list
   */
  protected onAddExcludePermission(value: string): void {
    if (value && !this.excludePermissions().includes(value)) {
      this.excludePermissions.update((perms) => [...perms, value]);
    }
  }

  /**
   * Remove permission from exclude list
   */
  protected onRemoveExcludePermission(value: string): void {
    this.excludePermissions.update((perms) => perms.filter((p) => p !== value));
  }

  /**
   * Handle manual ID input (disables auto-generation)
   */
  protected onIdInput(): void {
    this.isAutoGeneratingId.set(false);
    const idControl = this.form().get('id');
    if (idControl) {
      this.idPreview.set(idControl.value || '');
    }
    // Clear uniqueness error when user types
    this.idUniquenessError.set(null);
  }

  /**
   * Toggle auto-generation of ID
   */
  protected toggleAutoGenerateId(): void {
    const newValue = !this.isAutoGeneratingId();
    this.isAutoGeneratingId.set(newValue);
    
    if (newValue) {
      // Re-generate from label
      this.regenerateIdFromLabel();
    }
  }

  /**
   * Regenerate ID from label
   */
  protected regenerateIdFromLabel(): void {
    const label = this.form().get('label')?.value;
    if (label) {
      const generatedId = slugify(label, 128);
      this.idPreview.set(generatedId);
      this.form().get('id')?.setValue(generatedId);
      this.isAutoGeneratingId.set(true);
      // Clear uniqueness error
      this.idUniquenessError.set(null);
    }
  }

  /**
   * Check ID uniqueness on blur
   */
  protected onIdBlur(): void {
    const idControl = this.form().get('id');
    const currentId = idControl?.value;
    
    // Skip check if ID is empty or invalid
    if (!currentId || idControl?.invalid) {
      return;
    }

    // Skip check if editing and ID hasn't changed
    const existingItem = this.item();
    if (existingItem && existingItem.id === currentId) {
      return;
    }

    // Check uniqueness by trying to fetch the item
    this.isCheckingIdUniqueness.set(true);
    this.idUniquenessError.set(null);

    this.http.get(`/api/v1/navigations/${currentId}`).subscribe({
      next: () => {
        // ID exists - show error
        this.idUniquenessError.set(
          this.translocoService.translate('navigationManagement.editor.form.id.errors.duplicate')
        );
        this.isCheckingIdUniqueness.set(false);
      },
      error: (err) => {
        // 404 means ID is available (good)
        if (err.status === 404) {
          this.idUniquenessError.set(null);
        } else {
          // Other errors - log but don't block
          console.error('Error checking ID uniqueness:', err);
        }
        this.isCheckingIdUniqueness.set(false);
      },
    });
  }
}
