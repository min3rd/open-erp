import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  CatalogHierarchyMode,
  CatalogRelationType,
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
  CatalogAttributesSchema,
  CatalogScope,
  CatalogTypeDto,
  CatalogTypePayload
} from '../../core/services/catalog-admin.service';

const RELATION_TYPES: CatalogRelationType[] = [
  CatalogRelationType.HIERARCHY,
  CatalogRelationType.CLASSIFICATION,
  CatalogRelationType.ALLOCATION,
  CatalogRelationType.CUSTOM
];

/**
 * Create/edit a catalogue type in a right-side drawer (DES-UI-S05-001 §2).
 * System scope writes the platform catalogue (`catalog:system:manage`).
 */
@Component({
  selector: 'app-catalog-type-drawer',
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
  templateUrl: './catalog-type-drawer.component.html'
})
export class CatalogTypeDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  type = input<CatalogTypeDto | null>(null);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  saved = output<string>();

  readonly relationTypes = RELATION_TYPES;
  readonly hierarchyOptions = [
    { value: CatalogHierarchyMode.TREE, labelKey: 'CATALOG_MODE_TREE' },
    { value: CatalogHierarchyMode.DAG, labelKey: 'CATALOG_MODE_DAG' },
    { value: CatalogHierarchyMode.FLAT, labelKey: 'CATALOG_MODE_FLAT' }
  ];
  readonly statusOptions = [
    { value: CatalogStatus.ACTIVE, labelKey: 'CATALOG_STATUS_ACTIVE' },
    { value: CatalogStatus.INACTIVE, labelKey: 'CATALOG_STATUS_INACTIVE' }
  ];

  readonly code = signal('');
  readonly nameKey = signal('');
  readonly descriptionKey = signal('');
  readonly hierarchyMode = signal<CatalogHierarchyMode>(CatalogHierarchyMode.TREE);
  readonly allowedRelations = signal<CatalogRelationType[]>([CatalogRelationType.HIERARCHY]);
  readonly allowedParentTypes = signal('');
  readonly maxDepth = signal('');
  readonly minParents = signal('0');
  readonly allowFreeText = signal(false);
  readonly versioned = signal(true);
  readonly effectiveDated = signal(true);
  readonly status = signal<CatalogStatus>(CatalogStatus.ACTIVE);
  readonly attributesSchema = signal('');

  readonly saving = signal(false);
  readonly errorText = signal('');

  readonly isEdit = computed(() => !!this.type()?.id);
  readonly titleKey = computed(() => (this.isEdit() ? 'CATALOG_TYPE_FORM_EDIT_TITLE' : 'CATALOG_TYPE_FORM_CREATE_TITLE'));

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const type = this.type();
      if (!open) {
        return;
      }
      this.reset(type);
    });
  }

  private reset(type: CatalogTypeDto | null): void {
    this.code.set(type?.code ?? '');
    this.nameKey.set(type?.name_key ?? '');
    this.descriptionKey.set(type?.description_key ?? '');
    this.hierarchyMode.set(type?.hierarchy_mode ?? CatalogHierarchyMode.TREE);
    this.allowedRelations.set(type?.allowed_relations?.length ? [...type.allowed_relations] : [CatalogRelationType.HIERARCHY]);
    this.allowedParentTypes.set(type?.allowed_parent_types?.join(', ') ?? '');
    this.maxDepth.set(type?.max_depth !== null && type?.max_depth !== undefined ? String(type.max_depth) : '');
    this.minParents.set(String(type?.min_parents ?? 0));
    this.allowFreeText.set(type?.allow_free_text ?? false);
    this.versioned.set(type?.versioned ?? true);
    this.effectiveDated.set(type?.effective_dated ?? true);
    this.status.set(type?.status ?? CatalogStatus.ACTIVE);
    this.attributesSchema.set(type?.attributes_schema ? JSON.stringify(type.attributes_schema, null, 2) : '');
    this.errorText.set('');
  }

  hasRelation(relation: CatalogRelationType): boolean {
    return this.allowedRelations().includes(relation);
  }

  toggleRelation(relation: CatalogRelationType, checked: boolean): void {
    const next = new Set(this.allowedRelations());
    if (checked) {
      next.add(relation);
    } else {
      next.delete(relation);
    }
    this.allowedRelations.set([...next]);
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    if (!this.code().trim() || !this.nameKey().trim()) {
      this.errorText.set(this.i18n.t('CATALOG_TYPE_REQUIRED_FIELDS'));
      return;
    }
    if (!this.allowedRelations().length) {
      this.errorText.set(this.i18n.t('CATALOG_TYPE_RELATION_REQUIRED'));
      return;
    }
    let schema: CatalogAttributesSchema | null = null;
    if (this.attributesSchema().trim()) {
      try {
        schema = JSON.parse(this.attributesSchema()) as CatalogAttributesSchema;
      } catch {
        this.errorText.set(this.i18n.t('CATALOG_TYPE_SCHEMA_INVALID'));
        return;
      }
    }

    const parentTypes = this.allowedParentTypes()
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    const payload: CatalogTypePayload = {
      code: this.code().trim().toUpperCase(),
      name_key: this.nameKey().trim(),
      description_key: this.descriptionKey().trim() || null,
      hierarchy_mode: this.hierarchyMode(),
      allowed_relations: this.allowedRelations(),
      allowed_parent_types: parentTypes.length ? parentTypes : null,
      max_depth: this.maxDepth().trim() ? Number(this.maxDepth()) : null,
      min_parents: Number(this.minParents()) || 0,
      allow_free_text: this.allowFreeText(),
      versioned: this.versioned(),
      effective_dated: this.effectiveDated(),
      attributes_schema: schema,
      status: this.status()
    };

    this.saving.set(true);
    this.errorText.set('');
    const request = this.isEdit()
      ? this.catalog.updateType(this.type()!.id, payload, this.scope())
      : this.catalog.createType(payload, this.scope());
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
