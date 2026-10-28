import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  CatalogItemRef,
  CatalogPickerComponent,
  CatalogRelationType,
  DrawerComponent,
  I18nService,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TranslatePipe
} from '@shared';
import {
  CatalogAdminService,
  CatalogItemDto,
  CatalogScope,
  CatalogTypeDto,
  CatalogTypeRelationGroup
} from '../../core/services/catalog-admin.service';

/**
 * Add a parent edge to an item (multi-parent DAG, DES-UI-S05-001 §2 "Drawer
 * thêm quan hệ"): parent picked with the shared `catalog-picker`, relation type
 * limited to the type's `allowed_relations`. Cycle/duplicate errors come back
 * as codes (`CATALOG_EDGE_CYCLE`, `CATALOG_EDGE_DUPLICATE`) and are shown inline.
 */
@Component({
  selector: 'app-catalog-edge-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    CatalogPickerComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    TranslatePipe
  ],
  templateUrl: './catalog-edge-drawer.component.html'
})
export class CatalogEdgeDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  child = input<CatalogItemDto | null>(null);
  parent = input<CatalogItemDto | null>(null);
  mode = input<'parent' | 'child'>('parent');
  type = input<CatalogTypeDto | null>(null);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  created = output<string>();

  readonly parentTypeCode = signal('');
  readonly parentRef = signal<CatalogItemRef | null>(null);
  readonly childTypeCode = signal('');
  readonly childRef = signal<CatalogItemRef | null>(null);
  readonly relationGroups = signal<CatalogTypeRelationGroup[]>([]);
  readonly relationType = signal<CatalogRelationType>(CatalogRelationType.HIERARCHY);
  readonly sortOrder = signal('0');
  readonly saving = signal(false);
  readonly errorText = signal('');

  readonly isChildMode = computed(() => this.mode() === 'child');

  /** In child mode only relations that define child types are selectable. */
  readonly relationOptions = computed(() => {
    if (this.isChildMode()) {
      return this.relationGroups()
        .filter((group) => (group.children?.length ?? 0) > 0)
        .map((group) => ({ value: group.relation_type, labelKey: `CATALOG_RELATION_${group.relation_type}` }));
    }
    const relations = this.type()?.allowed_relations?.length
      ? this.type()!.allowed_relations
      : [CatalogRelationType.HIERARCHY];
    return relations.map((relation) => ({ value: relation, labelKey: `CATALOG_RELATION_${relation}` }));
  });

  /** Child type choices for the selected relation (child mode). */
  readonly childTypeOptions = computed(() => {
    const group = this.relationGroups().find((entry) => entry.relation_type === this.relationType());
    return (group?.children ?? []).map((entry) => ({ value: entry.code, label: entry.code }));
  });

  /** `allowed_parent_types` NULL = same type only (safe default). */
  readonly parentTypeOptions = computed(() => {
    const type = this.type();
    if (!type) {
      return [];
    }
    const codes = type.allowed_parent_types?.length ? type.allowed_parent_types : [type.code];
    return codes.map((code) => ({ value: code, label: code }));
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const type = this.type();
      if (!open) {
        return;
      }
      const parentTypes = type?.allowed_parent_types?.length ? type.allowed_parent_types : type ? [type.code] : [];
      this.parentTypeCode.set(parentTypes[0] ?? '');
      this.parentRef.set(null);
      this.childRef.set(null);
      this.childTypeCode.set('');
      this.relationGroups.set([]);
      this.relationType.set(type?.allowed_relations?.[0] ?? CatalogRelationType.HIERARCHY);
      this.sortOrder.set('0');
      this.errorText.set('');
      if (this.isChildMode() && type?.code) {
        this.loadRelationGroups(type.code);
      }
    });
  }

  private loadRelationGroups(typeCode: string): void {
    this.catalog.getTypeRelations(typeCode, this.scope()).subscribe({
      next: (res) => {
        const groups = res?.data?.relations ?? [];
        this.relationGroups.set(groups);
        const first = groups.find((group) => (group.children?.length ?? 0) > 0) ?? null;
        if (first) {
          this.relationType.set(first.relation_type);
          this.childTypeCode.set(first.children[0]?.code ?? '');
        }
      }
    });
  }

  onRelationChanged(relation: CatalogRelationType): void {
    this.relationType.set(relation);
    this.childTypeCode.set(this.childTypeOptions()[0]?.value ?? '');
    this.childRef.set(null);
  }

  onParentSelected(ref: CatalogItemRef | CatalogItemRef[] | null): void {
    this.parentRef.set(Array.isArray(ref) ? ref[0] ?? null : ref);
  }

  onChildSelected(ref: CatalogItemRef | CatalogItemRef[] | null): void {
    this.childRef.set(Array.isArray(ref) ? ref[0] ?? null : ref);
  }

  save(): void {
    if (this.isChildMode()) {
      const parent = this.parent();
      const child = this.childRef();
      if (!parent?.id || !child?.catalog_item_id) {
        this.errorText.set(this.i18n.t('CATALOG_EDGE_CHILD_REQUIRED'));
        return;
      }
      this.createEdge(parent.id, child.catalog_item_id);
      return;
    }
    const child = this.child();
    const parent = this.parentRef();
    if (!child?.id || !parent?.catalog_item_id) {
      this.errorText.set(this.i18n.t('CATALOG_EDGE_PARENT_REQUIRED'));
      return;
    }
    this.createEdge(parent.catalog_item_id, child.id);
  }

  private createEdge(parentItemId: string, childItemId: string): void {
    this.saving.set(true);
    this.errorText.set('');
    this.catalog
      .createEdge(
        {
          parent_item_id: parentItemId,
          child_item_id: childItemId,
          relation_type: this.relationType(),
          sort_order: Number(this.sortOrder()) || 0
        },
        this.scope()
      )
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.created.emit(res.code);
        },
        error: (err) => {
          this.saving.set(false);
          const apiError = err as ApiErrorResponse;
          this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
        }
      });
  }
}
