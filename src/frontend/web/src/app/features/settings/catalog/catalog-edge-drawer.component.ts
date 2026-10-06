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
  CatalogTypeDto
} from '../../../core/services/catalog-admin.service';

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
  type = input<CatalogTypeDto | null>(null);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  created = output<string>();

  readonly parentTypeCode = signal('');
  readonly parentRef = signal<CatalogItemRef | null>(null);
  readonly relationType = signal<CatalogRelationType>(CatalogRelationType.HIERARCHY);
  readonly sortOrder = signal('0');
  readonly saving = signal(false);
  readonly errorText = signal('');

  /** `allowed_parent_types` NULL = same type only (safe default). */
  readonly parentTypeOptions = computed(() => {
    const type = this.type();
    if (!type) {
      return [];
    }
    const codes = type.allowed_parent_types?.length ? type.allowed_parent_types : [type.code];
    return codes.map((code) => ({ value: code, label: code }));
  });

  readonly relationOptions = computed(() => {
    const relations = this.type()?.allowed_relations?.length
      ? this.type()!.allowed_relations
      : [CatalogRelationType.HIERARCHY];
    return relations.map((relation) => ({ value: relation, labelKey: `CATALOG_RELATION_${relation}` }));
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
      this.relationType.set(type?.allowed_relations?.[0] ?? CatalogRelationType.HIERARCHY);
      this.sortOrder.set('0');
      this.errorText.set('');
    });
  }

  onParentSelected(ref: CatalogItemRef | CatalogItemRef[] | null): void {
    this.parentRef.set(Array.isArray(ref) ? ref[0] ?? null : ref);
  }

  save(): void {
    const child = this.child();
    const parent = this.parentRef();
    if (!child?.id || !parent?.catalog_item_id) {
      this.errorText.set(this.i18n.t('CATALOG_EDGE_PARENT_REQUIRED'));
      return;
    }
    this.saving.set(true);
    this.errorText.set('');
    this.catalog
      .createEdge(
        {
          parent_item_id: parent.catalog_item_id,
          child_item_id: child.id,
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
