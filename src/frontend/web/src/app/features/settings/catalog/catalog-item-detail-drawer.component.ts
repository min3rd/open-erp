import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApiErrorResponse,
  ApiResponse,
  BadgeComponent,
  CatalogRelationType,
  CatalogStatus,
  ColorVariant,
  DrawerComponent,
  I18nService,
  PaginationComponent,
  SkeletonComponent,
  TranslatePipe,
  formatDate,
  formatDateTime
} from '@shared';
import { CatalogItemLink } from '@shared';
import {
  CatalogAdminService,
  CatalogItemDto,
  CatalogScope,
  CatalogTypeDto,
  CatalogVersionDto
} from '../../../core/services/catalog-admin.service';

/** A DAG node can have many children; the drawer pages them 10 at a time. */
const CHILDREN_PAGE_SIZE = 10;

/**
 * Read-only item detail of the catalogue admin screen (DES-UI-S05-001 §2) shown
 * as a right-side drawer: information, dynamic attributes, relations (paginated
 * children), read-only version history and the mutate actions. The host keeps
 * the row selected while this drawer is open.
 */
@Component({
  selector: 'app-catalog-item-detail-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DrawerComponent, BadgeComponent, PaginationComponent, SkeletonComponent, TranslatePipe],
  templateUrl: './catalog-item-detail-drawer.component.html'
})
export class CatalogItemDetailDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  item = input<CatalogItemDto | null>(null);
  type = input<CatalogTypeDto | null>(null);
  versions = input<CatalogVersionDto[]>([]);
  loading = input<boolean>(false);
  error = input<boolean>(false);
  canMutate = input<boolean>(false);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  edit = output<CatalogItemDto>();
  addParent = output<CatalogItemDto>();
  closeValidity = output<CatalogItemDto>();
  retry = output<void>();
  edgeRemoved = output<ApiResponse<null>>();

  readonly childrenPageSize = CHILDREN_PAGE_SIZE;
  readonly formatDateTime = formatDateTime;
  readonly childrenPage = signal(0);
  readonly confirmEdgeId = signal<string | null>(null);
  readonly actionError = signal('');
  readonly actionSuccess = signal('');

  readonly subtitle = computed(() => {
    const item = this.item();
    return item ? `${item.code} · v${item.version}` : '';
  });
  readonly isSystemItem = computed(() => {
    const item = this.item();
    if (!item) {
      return false;
    }
    return item.is_system ?? (item.tenant_id === null || item.tenant_id === undefined);
  });
  readonly fields = computed(() => this.type()?.attributes_schema?.fields ?? []);
  readonly children = computed<CatalogItemLink[]>(() => this.item()?.children ?? []);
  readonly childrenTotalPages = computed(() => Math.ceil(this.children().length / CHILDREN_PAGE_SIZE));
  readonly pagedChildren = computed(() => {
    const start = this.childrenPage() * CHILDREN_PAGE_SIZE;
    return this.children().slice(start, start + CHILDREN_PAGE_SIZE);
  });

  private lastItemId: string | null = null;

  constructor() {
    // New item => first children page, no pending relation confirm/error.
    effect(() => {
      const id = this.item()?.id ?? null;
      if (id === this.lastItemId) {
        return;
      }
      this.lastItemId = id;
      this.childrenPage.set(0);
      this.confirmEdgeId.set(null);
      this.actionError.set('');
      this.actionSuccess.set('');
    });
  }

  attributeValue(key: string): string {
    const value = this.item()?.attributes?.[key];
    return value === null || value === undefined ? '' : String(value);
  }

  rawAttributes(): Array<{ key: string; value: string }> {
    const attributes = this.item()?.attributes;
    if (!attributes) {
      return [];
    }
    return Object.entries(attributes).map(([key, value]) => ({
      key,
      value: value === null || value === undefined ? '' : String(value)
    }));
  }

  validityLabel(item: CatalogItemDto): string {
    const from = formatDate(item.valid_from);
    const to = item.valid_to ? formatDate(item.valid_to) : this.i18n.t('CATALOG_VALID_TO_NOW');
    return `${from} → ${to}`;
  }

  historyValidity(version: CatalogVersionDto): string {
    const from = formatDateTime(version.valid_from);
    const to = version.valid_to ? formatDateTime(version.valid_to) : this.i18n.t('CATALOG_VALID_TO_NOW');
    return `${from} → ${to}`;
  }

  relationLabelKey(relation: CatalogRelationType): string {
    return `CATALOG_RELATION_${relation}`;
  }

  statusVariant(status: CatalogStatus): ColorVariant {
    return status === CatalogStatus.ACTIVE ? ColorVariant.SUCCESS : ColorVariant.DEFAULT;
  }

  askRemoveEdge(edgeId: string): void {
    this.confirmEdgeId.set(edgeId);
  }

  cancelRemoveEdge(): void {
    this.confirmEdgeId.set(null);
  }

  confirmRemoveEdge(edge: CatalogItemLink): void {
    this.catalog.deleteEdge(edge.edge_id, this.scope()).subscribe({
      next: (res) => {
        this.confirmEdgeId.set(null);
        this.actionError.set('');
        this.actionSuccess.set(this.i18n.t(res.code, res.params));
        this.edgeRemoved.emit(res);
      },
      error: (err) => {
        this.confirmEdgeId.set(null);
        this.actionSuccess.set('');
        const apiError = err as ApiErrorResponse;
        this.actionError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
