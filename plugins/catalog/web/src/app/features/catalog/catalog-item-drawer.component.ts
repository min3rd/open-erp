import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  CatalogStatus,
  DrawerComponent,
  I18nService,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpTextareaComponent,
  SharpToggleComponent,
  TranslatePipe
} from '@shared';
import {
  CatalogAdminService,
  CatalogAttributeField,
  CatalogItemDto,
  CatalogItemPayload,
  CatalogScope,
  CatalogTypeDto
} from '../../core/services/catalog-admin.service';

/**
 * Create/edit a catalogue item in a right-side drawer (DES-UI-S05-001 §2).
 * Editing is version-creating, so the drawer warns before saving; dynamic
 * fields render from the type's `attributes_schema`.
 */
@Component({
  selector: 'app-catalog-item-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpTextareaComponent,
    SharpToggleComponent,
    TranslatePipe
  ],
  templateUrl: './catalog-item-drawer.component.html'
})
export class CatalogItemDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  item = input<CatalogItemDto | null>(null);
  type = input<CatalogTypeDto | null>(null);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  saved = output<string>();

  readonly statusOptions = [
    { value: CatalogStatus.ACTIVE, labelKey: 'CATALOG_STATUS_ACTIVE' },
    { value: CatalogStatus.INACTIVE, labelKey: 'CATALOG_STATUS_INACTIVE' }
  ];

  readonly code = signal('');
  readonly name = signal('');
  readonly nameEn = signal('');
  readonly description = signal('');
  readonly sortOrder = signal('0');
  readonly status = signal<CatalogStatus>(CatalogStatus.ACTIVE);
  readonly attributes = signal<Record<string, unknown>>({});

  readonly saving = signal(false);
  readonly errorText = signal('');

  readonly isEdit = computed(() => !!this.item()?.id);
  readonly titleKey = computed(() => (this.isEdit() ? 'CATALOG_ITEM_FORM_EDIT_TITLE' : 'CATALOG_ITEM_FORM_CREATE_TITLE'));
  readonly fields = computed<CatalogAttributeField[]>(() => this.type()?.attributes_schema?.fields ?? []);
  readonly versionWarning = computed(() => this.isEdit() && (this.type()?.versioned ?? true));

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.item();
      if (!open) {
        return;
      }
      this.code.set(item?.code ?? '');
      this.name.set(item?.name ?? '');
      this.nameEn.set(item?.name_en ?? '');
      this.description.set(item?.description ?? '');
      this.sortOrder.set(String(item?.sort_order ?? 0));
      this.status.set(item?.status ?? CatalogStatus.ACTIVE);
      this.attributes.set(item?.attributes ? { ...item.attributes } : {});
      this.errorText.set('');
    });
  }

  attrText(key: string): string {
    const value = this.attributes()[key];
    return value === null || value === undefined ? '' : String(value);
  }

  attrBoolean(key: string): boolean {
    return this.attributes()[key] === true;
  }

  setAttr(field: CatalogAttributeField, value: string): void {
    this.attributes.update((attributes) => ({
      ...attributes,
      [field.key]: field.type === 'NUMBER' && value !== '' ? Number(value) : value
    }));
  }

  setAttrBoolean(key: string, checked: boolean): void {
    this.attributes.update((attributes) => ({ ...attributes, [key]: checked }));
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    if (!this.code().trim() || !this.name().trim()) {
      this.errorText.set(this.i18n.t('CATALOG_ITEM_REQUIRED_FIELDS'));
      return;
    }
    const payload: CatalogItemPayload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      name_en: this.nameEn().trim() || null,
      description: this.description().trim() || null,
      attributes: Object.keys(this.attributes()).length ? this.attributes() : null,
      sort_order: Number(this.sortOrder()) || 0,
      status: this.status()
    };

    this.saving.set(true);
    this.errorText.set('');
    const typeCode = this.type()?.code;
    if (!typeCode) {
      this.saving.set(false);
      this.errorText.set(this.i18n.t('INTERNAL_SERVER_ERROR'));
      return;
    }
    const request = this.isEdit()
      ? this.catalog.updateItem(this.item()!.id, payload, this.scope())
      : this.catalog.createItem(typeCode, payload, this.scope());
    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saved.emit(res.code);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
