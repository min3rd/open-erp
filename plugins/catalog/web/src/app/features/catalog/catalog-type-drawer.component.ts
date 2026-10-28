import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
  CatalogTypePayload,
  CatalogTypeRelationPayload
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
  types = input<CatalogTypeDto[]>([]);
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
  readonly parentSelections = signal<Record<string, string[]>>({});
  readonly childSelections = signal<Record<string, string[]>>({});
  readonly relationsLoading = signal(false);
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
  readonly isSystemSource = computed(() => this.scope() === CatalogScope.TENANT && !!this.type()?.is_system);
  readonly titleKey = computed(() => (this.isEdit() ? 'CATALOG_TYPE_FORM_EDIT_TITLE' : 'CATALOG_TYPE_FORM_CREATE_TITLE'));
  readonly selectableTypes = computed(() =>
    this.types()
      .filter((entry) => entry.code !== this.code())
      .slice()
      .sort((left, right) => left.code.localeCompare(right.code))
  );

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
    this.parentSelections.set({});
    this.childSelections.set({});
    this.loadRelations(type);
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

  isParentSelected(relation: CatalogRelationType, code: string): boolean {
    return (this.parentSelections()[relation] ?? []).includes(code);
  }

  isChildSelected(relation: CatalogRelationType, code: string): boolean {
    return (this.childSelections()[relation] ?? []).includes(code);
  }

  toggleParent(relation: CatalogRelationType, code: string): void {
    this.parentSelections.update((selections) => ({
      ...selections,
      [relation]: toggleCode(selections[relation] ?? [], code)
    }));
  }

  toggleChild(relation: CatalogRelationType, code: string): void {
    this.childSelections.update((selections) => ({
      ...selections,
      [relation]: toggleCode(selections[relation] ?? [], code)
    }));
  }

  private loadRelations(type: CatalogTypeDto | null): void {
    if (!type?.code) {
      this.relationsLoading.set(false);
      return;
    }
    this.relationsLoading.set(true);
    this.catalog.getTypeRelations(type.code, this.scope()).subscribe({
      next: (res) => {
        const parents: Record<string, string[]> = {};
        const children: Record<string, string[]> = {};
        for (const group of res?.data?.relations ?? []) {
          parents[group.relation_type] = (group.parents ?? []).map((item) => item.code);
          children[group.relation_type] = (group.children ?? []).map((item) => item.code);
        }
        this.parentSelections.set(parents);
        this.childSelections.set(children);
        this.relationsLoading.set(false);
      },
      error: () => this.relationsLoading.set(false)
    });
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

    const parentTypes = [
      ...new Set(Object.values(this.parentSelections()).flat())
    ].sort();

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
    if (this.isSystemSource()) {
      this.catalog.cloneType(this.type()!.code, this.scope()).subscribe({
        next: (res) => {
          const tenantTypeId = res?.data?.tenant_type_id;
          if (!tenantTypeId) {
            this.saving.set(false);
            this.errorText.set(this.i18n.t('INTERNAL_SERVER_ERROR'));
            return;
          }
          this.persistType(tenantTypeId, payload);
        },
        error: (err) => {
          this.saving.set(false);
          const apiError = err as ApiErrorResponse;
          this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
        }
      });
      return;
    }
    this.persistType(this.type()?.id ?? '', payload);
  }

  /** Saves the type row (create when no id) and then the per-relation links. */
  private persistType(typeId: string, payload: CatalogTypePayload): void {
    const request = this.isEdit()
      ? this.catalog.updateType(typeId, payload, this.scope())
      : this.catalog.createType(payload, this.scope());
    request.subscribe({
      next: (res) => {
        const savedCode = res?.data?.code ?? payload.code;
        this.persistRelations(savedCode);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  /** Relations are saved per relation type after the type row itself succeeds. */
  private persistRelations(typeCode: string): void {
    const requests = this.allowedRelations()
      .filter((relation) =>
        this.isEdit() || (this.parentSelections()[relation]?.length ?? 0) > 0 || (this.childSelections()[relation]?.length ?? 0) > 0
      )
      .map((relation) => {
        const payload: CatalogTypeRelationPayload = {
          relation_type: relation,
          parent_codes: this.parentSelections()[relation] ?? [],
          child_codes: this.childSelections()[relation] ?? []
        };
        return this.catalog.replaceTypeRelations(typeCode, payload, this.scope());
      });
    if (!requests.length) {
      this.finishSave(typeCode);
      return;
    }
    forkJoin(requests).subscribe({
      next: () => this.finishSave(typeCode),
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  private finishSave(typeCode: string): void {
    this.saving.set(false);
    this.saved.emit(typeCode);
  }
}

function toggleCode(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((entry) => entry !== code) : [...list, code];
}
