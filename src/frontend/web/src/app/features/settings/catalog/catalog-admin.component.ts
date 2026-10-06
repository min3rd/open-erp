import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ApiErrorResponse,
  ApiResponse,
  BadgeComponent,
  CatalogRelationType,
  CatalogStatus,
  ColorVariant,
  ContextMenuItem,
  I18nService,
  IconComponent,
  IconName,
  PaginationComponent,
  RequirePermissionDirective,
  SharpInputComponent,
  SharpSelectComponent,
  SkeletonComponent,
  SkeletonTableComponent,
  TableColumn,
  TableComponent,
  TranslatePipe,
  formatDate
} from '@shared';
import { AuthService } from '../../../core/services/auth.service';
import {
  CatalogAdminService,
  CatalogDescendantDto,
  CatalogItemDto,
  CatalogScope,
  CatalogTypeDto,
  CatalogVersionDto
} from '../../../core/services/catalog-admin.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';
import { CatalogTypeDrawerComponent } from './catalog-type-drawer.component';
import { CatalogItemDrawerComponent } from './catalog-item-drawer.component';
import { CatalogItemDetailDrawerComponent } from './catalog-item-detail-drawer.component';
import { CatalogApiDrawerComponent } from './catalog-api-drawer.component';
import { CatalogEdgeDrawerComponent } from './catalog-edge-drawer.component';
import { CatalogGrantsDrawerComponent } from './catalog-grants-drawer.component';
import { CatalogImportExportDrawerComponent } from './catalog-import-export-drawer.component';

/** Middle-column view modes (DES-UI-S05-001 §2). */
export enum CatalogViewMode {
  LIST = 'list',
  TREE = 'tree',
  MULTI = 'multi'
}

/** Route-addressable drawers/confirm states (no modal anywhere). */
export enum CatalogDrawerMode {
  LIST = 'list',
  DETAIL = 'detail',
  CREATE = 'create',
  EDIT = 'edit',
  EDGE = 'edge',
  GRANTS = 'grants',
  IMPORT = 'import',
  CLOSE = 'close',
  API = 'api',
  TYPE_CREATE = 'type-create',
  TYPE_EDIT = 'type-edit'
}

const TYPE_MODES: ReadonlySet<string> = new Set([CatalogDrawerMode.TYPE_CREATE, CatalogDrawerMode.TYPE_EDIT]);
const SEARCH_DEBOUNCE_MS = 300;
const TREE_DEPTH = 10;

interface ParentGroup {
  count: number;
  labelKey: string;
  items: CatalogItemDto[];
}

/**
 * Catalogue admin screen (TASK-385 / TASK-392): two independent columns —
 * types and items — with stacked drawers for the item detail, type/item/edge/
 * grants, import/export and the API usage panel. Reused for the platform system
 * catalogue via route data `catalogScope: 'system'` (no duplicated component).
 */
@Component({
  selector: 'app-catalog-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    SkeletonTableComponent,
    SkeletonComponent,
    PaginationComponent,
    BadgeComponent,
    SharpInputComponent,
    SharpSelectComponent,
    TranslatePipe,
    RequirePermissionDirective,
    IconComponent,
    CatalogTypeDrawerComponent,
    CatalogItemDrawerComponent,
    CatalogItemDetailDrawerComponent,
    CatalogApiDrawerComponent,
    CatalogEdgeDrawerComponent,
    CatalogGrantsDrawerComponent,
    CatalogImportExportDrawerComponent
  ],
  providers: [PathListStateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog-admin.component.html'
})
export class CatalogAdminComponent implements OnInit {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private listState = inject(PathListStateService);

  /** `tenant` (settings) or `system` (platform portal, TASK-392). */
  readonly scope = signal<CatalogScope>(
    this.route.snapshot.data['catalogScope'] === CatalogScope.SYSTEM ? CatalogScope.SYSTEM : CatalogScope.TENANT
  );
  private readonly basePath = this.scope() === CatalogScope.SYSTEM ? '/platform/catalog' : '/settings/catalog';

  readonly viewModes = [CatalogViewMode.LIST, CatalogViewMode.TREE, CatalogViewMode.MULTI];
  readonly statusOptions = [
    { value: '', labelKey: 'CATALOG_FILTER_STATUS_ALL' },
    { value: CatalogStatus.ACTIVE, labelKey: 'CATALOG_STATUS_ACTIVE' },
    { value: CatalogStatus.INACTIVE, labelKey: 'CATALOG_STATUS_INACTIVE' }
  ];

  // ---------------------------------------------------------------------
  // Column 1 — types
  // ---------------------------------------------------------------------
  readonly types = signal<CatalogTypeDto[]>([]);
  readonly typesLoading = signal<boolean>(false);
  readonly typesError = signal<boolean>(false);
  readonly typeSearch = signal<string>('');
  readonly selectedType = signal<CatalogTypeDto | null>(null);

  // ---------------------------------------------------------------------
  // Column 2 — items
  // ---------------------------------------------------------------------
  readonly items = signal<CatalogItemDto[]>([]);
  readonly itemsLoading = signal<boolean>(false);
  readonly itemsError = signal<boolean>(false);
  readonly page = signal<number>(0);
  readonly size = signal<number>(20);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly q = signal<string>('');
  readonly statusFilter = signal<CatalogStatus | ''>('');
  readonly asOf = signal<string>('');
  readonly relationFilter = signal<CatalogRelationType | ''>('');
  readonly viewMode = signal<CatalogViewMode>(CatalogViewMode.LIST);
  readonly descendants = signal<CatalogDescendantDto[]>([]);
  readonly treeLoading = signal<boolean>(false);

  // ---------------------------------------------------------------------
  // Detail drawer (read-only info + relations + version history)
  // ---------------------------------------------------------------------
  readonly selectedItem = signal<CatalogItemDto | null>(null);
  readonly versions = signal<CatalogVersionDto[]>([]);
  readonly detailLoading = signal<boolean>(false);
  readonly detailError = signal<boolean>(false);
  readonly detailDrawerOpen = signal<boolean>(false);

  // ---------------------------------------------------------------------
  // Drawers + inline confirmations
  // ---------------------------------------------------------------------
  readonly typeDrawerOpen = signal<boolean>(false);
  readonly editingType = signal<CatalogTypeDto | null>(null);
  readonly itemDrawerOpen = signal<boolean>(false);
  readonly editingItem = signal<CatalogItemDto | null>(null);
  readonly edgeDrawerOpen = signal<boolean>(false);
  readonly grantsDrawerOpen = signal<boolean>(false);
  readonly importDrawerOpen = signal<boolean>(false);
  readonly apiDrawerOpen = signal<boolean>(false);
  readonly confirmClose = signal<CatalogItemDto | null>(null);
  readonly closingItem = signal<boolean>(false);

  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly columns: TableColumn[] = [
    { key: 'code', labelKey: 'CATALOG_COL_CODE', mono: true, width: '5.5rem' },
    { key: 'name', labelKey: 'CATALOG_COL_NAME' },
    { key: 'parents', labelKey: 'CATALOG_COL_PARENTS', width: '4rem' },
    { key: 'version', labelKey: 'CATALOG_COL_VERSION', width: '4rem' },
    { key: 'valid', labelKey: 'CATALOG_COL_VALID', width: '8rem' },
    { key: 'status', labelKey: 'CATALOG_COL_STATUS', width: '5.5rem' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right', width: '4rem' }
  ];

  readonly canManageItems = computed(() =>
    this.scope() === CatalogScope.SYSTEM
      ? this.auth.hasPermission('catalog:system:manage') !== false
      : this.auth.hasPermission('catalog:item:manage') !== false
  );
  readonly canManageTypes = computed(() =>
    this.scope() === CatalogScope.SYSTEM
      ? this.auth.hasPermission('catalog:system:manage') !== false
      : this.auth.hasPermission('catalog:type:manage') !== false
  );
  readonly itemPermission = computed(() =>
    this.scope() === CatalogScope.SYSTEM ? 'catalog:system:manage' : 'catalog:item:manage'
  );
  readonly typePermission = computed(() =>
    this.scope() === CatalogScope.SYSTEM ? 'catalog:system:manage' : 'catalog:type:manage'
  );
  readonly isSystemScope = computed(() => this.scope() === CatalogScope.SYSTEM);

  readonly filteredTypes = computed(() => {
    const term = this.typeSearch().trim().toLowerCase();
    const list = term
      ? this.types().filter((type) =>
          type.code.toLowerCase().includes(term) || this.i18n.t(type.name_key).toLowerCase().includes(term))
      : this.types();
    // System types first, then tenant types (DES-UI-S05-001 §2 column 1).
    return [...list].sort((a, b) => Number(this.isSystemType(b)) - Number(this.isSystemType(a)) || a.code.localeCompare(b.code));
  });

  readonly relationOptions = computed(() => {
    const relations = this.selectedType()?.allowed_relations ?? [];
    return [
      { value: '', labelKey: 'CATALOG_FILTER_RELATION_ALL' },
      ...relations.map((relation) => ({ value: relation, labelKey: `CATALOG_RELATION_${relation}` }))
    ];
  });

  readonly detailAttributeFields = computed(() => this.selectedType()?.attributes_schema?.fields ?? []);

  readonly parentGroups = computed<ParentGroup[]>(() => {
    const groups = new Map<number, CatalogItemDto[]>();
    for (const item of this.items()) {
      const count = this.parentCount(item);
      const bucket = groups.get(count) ?? [];
      bucket.push(item);
      groups.set(count, bucket);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([count, groupItems]) => ({
        count,
        labelKey: count === 0 ? 'CATALOG_MULTI_PARENT_NONE' : 'CATALOG_ITEM_PARENTS_COUNT',
        items: groupItems
      }));
  });

  private loadedListKey = '';
  private pendingState: PathListState | null = null;
  /** After a version-creating save, re-select the new version by code. */
  private reselectCode: string | null = null;
  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadTypes();
    this.listState.bind(this.basePath, (state, keyword) => this.applyState(state, keyword));
  }

  // ---------------------------------------------------------------------
  // Route state (filter = type code, id = item, mode = drawer)
  // ---------------------------------------------------------------------

  private applyState(state: PathListState, keyword: string): void {
    this.pendingState = state;
    this.q.set(keyword);
    this.page.set(state.page - 1);
    this.size.set(state.pageSize);
    this.applyQueryParams();
    if (this.types().length) {
      this.applySelection(state);
    }
  }

  private applyQueryParams(): void {
    const query = this.route.snapshot.queryParamMap;
    this.statusFilter.set((query.get('status') as CatalogStatus | null) ?? '');
    this.asOf.set(query.get('as_of') ?? '');
    this.relationFilter.set((query.get('relation_type') as CatalogRelationType | null) ?? '');
    const view = query.get('view');
    this.viewMode.set(view === CatalogViewMode.TREE || view === CatalogViewMode.MULTI ? view : CatalogViewMode.LIST);
  }

  private applySelection(state: PathListState): void {
    const list = this.types();
    if (!list.length) {
      return;
    }
    const type = list.find((entry) => entry.code === state.filter) ?? list[0];
    if (type.code !== this.selectedType()?.code) {
      this.selectedType.set(type);
      this.selectedItem.set(null);
      this.versions.set([]);
      this.descendants.set([]);
      this.detailError.set(false);
      this.confirmClose.set(null);
    }
    this.loadItemsIfNeeded();
    if (!TYPE_MODES.has(state.mode)) {
      this.applyItemSelection(state);
    }
    this.applyDrawerMode(state);
  }

  private applyItemSelection(state: PathListState): void {
    if (state.id && state.id !== this.selectedItem()?.id) {
      const inPage = this.items().find((item) => item.id === state.id);
      if (inPage) {
        this.selectItem(inPage, false);
      } else {
        this.loadDetail(state.id);
      }
    } else if (!state.id && this.selectedItem()) {
      this.selectedItem.set(null);
      this.versions.set([]);
      this.descendants.set([]);
    }
  }

  private applyDrawerMode(state: PathListState): void {
    this.typeDrawerOpen.set(false);
    this.itemDrawerOpen.set(false);
    this.edgeDrawerOpen.set(false);
    this.grantsDrawerOpen.set(false);
    this.importDrawerOpen.set(false);
    this.detailDrawerOpen.set(false);
    this.apiDrawerOpen.set(false);
    this.confirmClose.set(null);

    switch (state.mode) {
      case CatalogDrawerMode.DETAIL:
        if (state.id || this.selectedItem()) {
          this.detailDrawerOpen.set(true);
        }
        break;
      case CatalogDrawerMode.API:
        if (this.selectedType()) {
          this.apiDrawerOpen.set(true);
        }
        break;
      case CatalogDrawerMode.TYPE_CREATE:
        this.editingType.set(null);
        this.typeDrawerOpen.set(true);
        break;
      case CatalogDrawerMode.TYPE_EDIT:
        if (this.selectedType() && this.canMutateType(this.selectedType())) {
          this.editingType.set(this.selectedType());
          this.typeDrawerOpen.set(true);
        }
        break;
      case CatalogDrawerMode.CREATE:
        if (this.selectedType()) {
          this.editingItem.set(null);
          this.itemDrawerOpen.set(true);
        }
        break;
      case CatalogDrawerMode.EDIT:
        if (this.selectedItem() && this.canMutateItem(this.selectedItem())) {
          this.editingItem.set(this.selectedItem());
          this.itemDrawerOpen.set(true);
        }
        break;
      case CatalogDrawerMode.EDGE:
        if (this.selectedItem() && this.canMutateItem(this.selectedItem())) {
          this.edgeDrawerOpen.set(true);
        }
        break;
      case CatalogDrawerMode.GRANTS:
        if (this.selectedType() && !this.isSystemScope() && this.canMutateType(this.selectedType())) {
          this.grantsDrawerOpen.set(true);
        }
        break;
      case CatalogDrawerMode.IMPORT:
        this.importDrawerOpen.set(true);
        break;
      case CatalogDrawerMode.CLOSE:
        if (this.selectedItem() && this.canMutateItem(this.selectedItem())) {
          this.confirmClose.set(this.selectedItem());
        }
        break;
      default:
        break;
    }
  }

  /** Replaces the query params with the full filter set (path-list-state contract). */
  private syncState(patch: Partial<PathListState>, keyword?: string): void {
    this.listState.set(patch, keyword ?? this.q(), {
      status: this.statusFilter() || null,
      as_of: this.asOf() || null,
      relation_type: this.relationFilter() || null,
      view: this.viewMode()
    });
  }

  // ---------------------------------------------------------------------
  // Column 1 — types
  // ---------------------------------------------------------------------

  loadTypes(): void {
    this.typesLoading.set(true);
    this.typesError.set(false);
    this.catalog.getTypes(this.scope()).subscribe({
      next: (res) => {
        this.types.set(res.data?.items ?? []);
        this.typesLoading.set(false);
        if (this.pendingState) {
          this.applySelection(this.pendingState);
        }
      },
      error: (err) => {
        this.typesLoading.set(false);
        this.typesError.set(true);
        this.showError(err);
      }
    });
  }

  isSystemType(type: CatalogTypeDto): boolean {
    return type.is_system ?? (type.tenant_id === null || type.tenant_id === undefined);
  }

  isSystemItem(item: CatalogItemDto | null | undefined): boolean {
    if (!item) {
      return false;
    }
    return item.is_system ?? (item.tenant_id === null || item.tenant_id === undefined);
  }

  /** System rows/types are platform-managed; tenants may only override by code. */
  canMutateItem(item: CatalogItemDto | null | undefined): boolean {
    return this.canManageItems() && !(this.scope() === CatalogScope.TENANT && this.isSystemItem(item));
  }

  canMutateType(type: CatalogTypeDto | null | undefined): boolean {
    if (!type || !this.canManageTypes()) {
      return false;
    }
    return !(this.scope() === CatalogScope.TENANT && this.isSystemType(type));
  }

  selectType(type: CatalogTypeDto): void {
    this.typeSearch.set('');
    this.syncState({ filter: type.code, id: null, mode: CatalogDrawerMode.LIST, page: 1 });
  }

  openTypeCreate(): void {
    this.syncState({ id: null, mode: CatalogDrawerMode.TYPE_CREATE });
  }

  openTypeEdit(): void {
    if (this.canMutateType(this.selectedType())) {
      this.syncState({ id: null, mode: CatalogDrawerMode.TYPE_EDIT });
    }
  }

  openGrants(): void {
    if (this.selectedType()) {
      this.syncState({ mode: CatalogDrawerMode.GRANTS });
    }
  }

  openApiDrawer(): void {
    if (this.selectedType()) {
      this.syncState({ mode: CatalogDrawerMode.API });
    }
  }

  onTypeSaved(code: string): void {
    this.syncState({ mode: CatalogDrawerMode.LIST });
    this.showSuccess(code);
    this.loadTypes();
  }

  // ---------------------------------------------------------------------
  // Column 2 — items
  // ---------------------------------------------------------------------

  private loadItemsIfNeeded(): void {
    const type = this.selectedType();
    if (!type) {
      return;
    }
    const key = [type.code, this.page(), this.size(), this.q(), this.statusFilter(), this.asOf(), this.relationFilter()].join('|');
    if (key === this.loadedListKey) {
      return;
    }
    this.loadedListKey = key;
    this.loadItems();
  }

  loadItems(): void {
    const type = this.selectedType();
    if (!type) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsError.set(false);
    this.catalog
      .getItems(type.code, {
        q: this.q() || undefined,
        status: this.statusFilter() || undefined,
        as_of: this.asOf() || undefined,
        relation_type: this.relationFilter() || undefined,
        page: this.page(),
        size: this.size()
      }, this.scope())
      .subscribe({
        next: (res) => {
          this.items.set(res.data?.items ?? []);
          this.totalItems.set(res.data?.total_items ?? 0);
          this.totalPages.set(res.data?.total_pages ?? 0);
          this.itemsLoading.set(false);
          // A version-creating save changed the item id: follow the new version.
          if (this.reselectCode) {
            const wanted = this.reselectCode;
            this.reselectCode = null;
            const match = this.items().find((item) => item.code === wanted);
            if (match) {
              this.selectItem(match, true);
              return;
            }
          }
          if (this.pendingState) {
            this.applyItemSelection(this.pendingState);
          }
        },
        error: (err) => {
          this.items.set([]);
          this.totalItems.set(0);
          this.totalPages.set(0);
          this.itemsLoading.set(false);
          this.itemsError.set(true);
          this.showError(err);
        }
      });
  }

  refreshItems(): void {
    this.loadedListKey = '';
    this.loadItemsIfNeeded();
    const current = this.selectedItem();
    if (current) {
      this.loadDetail(current.id);
    }
  }

  changePage(nextPage: number): void {
    this.syncState({ page: nextPage + 1 });
  }

  onSearchInput(value: string): void {
    this.q.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.syncState({ page: 1 }, this.q()), SEARCH_DEBOUNCE_MS);
  }

  onStatusChange(value: string): void {
    this.statusFilter.set((value as CatalogStatus) || '');
    this.syncState({ page: 1 });
  }

  onAsOfChange(value: string): void {
    this.asOf.set(value);
    this.syncState({ page: 1 });
  }

  onRelationChange(value: string): void {
    this.relationFilter.set((value as CatalogRelationType) || '');
    this.syncState({ page: 1 });
  }

  setViewMode(mode: CatalogViewMode): void {
    this.viewMode.set(mode);
    this.syncState({});
    this.loadTreeIfNeeded();
  }

  parentCount(item: CatalogItemDto): number {
    return item.parents_count ?? item.parents?.length ?? 0;
  }

  parentLabel(item: CatalogItemDto): string {
    const count = this.parentCount(item);
    return count === 0 ? this.i18n.t('CATALOG_MULTI_PARENT_NONE') : this.i18n.t('CATALOG_ITEM_PARENTS_COUNT', { count });
  }

  validityLabel(item: CatalogItemDto): string {
    const from = formatDate(item.valid_from);
    const to = item.valid_to ? formatDate(item.valid_to) : this.i18n.t('CATALOG_VALID_TO_NOW');
    return `${from} → ${to}`;
  }

  statusVariant(status: CatalogStatus): ColorVariant {
    return status === CatalogStatus.ACTIVE ? ColorVariant.SUCCESS : ColorVariant.DEFAULT;
  }

  /** Right-click shortcut for an item row (each action reuses the inline handler). */
  readonly itemContextMenu = (item: CatalogItemDto): ContextMenuItem[] => {
    const canMutate = this.canMutateItem(item);
    const disabledReasonKey = this.itemDisabledReason(item);
    return [
      {
        id: 'edit',
        labelKey: 'COMMON_EDIT',
        icon: IconName.EDIT,
        disabled: !canMutate,
        disabledReasonKey: canMutate ? undefined : disabledReasonKey,
        action: () => this.openEditItem(item)
      },
      {
        id: 'edge',
        labelKey: 'CATALOG_DETAIL_ADD_PARENT',
        icon: IconName.PLUS,
        disabled: !canMutate,
        disabledReasonKey: canMutate ? undefined : disabledReasonKey,
        action: () => this.openEdgeDrawer(item)
      },
      {
        id: 'detail',
        labelKey: 'COMMON_VIEW_DETAIL',
        icon: IconName.FILE_TEXT,
        action: () => this.selectItem(item)
      },
      {
        id: 'close',
        labelKey: 'CATALOG_ITEM_CLOSE_ACTION',
        icon: IconName.TRASH,
        danger: true,
        disabled: !canMutate,
        disabledReasonKey: canMutate ? undefined : disabledReasonKey,
        action: () => this.askCloseItem(item)
      }
    ];
  };

  private itemDisabledReason(item: CatalogItemDto): string {
    return this.scope() === CatalogScope.TENANT && this.isSystemItem(item)
      ? 'CATALOG_SYSTEM_READONLY'
      : 'COMMON_PERMISSION_REQUIRED';
  }

  openCreateItem(): void {
    this.syncState({ id: null, mode: CatalogDrawerMode.CREATE });
  }

  openEditItem(item: CatalogItemDto): void {
    if (!this.canMutateItem(item)) {
      return;
    }
    this.selectedItem.set(item);
    this.syncState({ id: item.id, mode: CatalogDrawerMode.EDIT });
  }

  openEdgeDrawer(item: CatalogItemDto): void {
    if (!this.canMutateItem(item)) {
      return;
    }
    this.selectedItem.set(item);
    this.syncState({ id: item.id, mode: CatalogDrawerMode.EDGE });
  }

  openImportExport(): void {
    this.syncState({ mode: CatalogDrawerMode.IMPORT });
  }

  closeDrawer(): void {
    this.syncState({ mode: CatalogDrawerMode.LIST });
  }

  onItemSaved(code: string): void {
    this.reselectCode = this.selectedItem()?.code ?? this.editingItem()?.code ?? null;
    this.selectedItem.set(null);
    this.versions.set([]);
    this.pendingState = this.pendingState ? { ...this.pendingState, id: null, mode: CatalogDrawerMode.LIST } : null;
    this.syncState({ id: null, mode: CatalogDrawerMode.LIST });
    this.showSuccess(code);
    this.refreshItems();
  }

  onEdgeCreated(code: string): void {
    this.syncState({ mode: CatalogDrawerMode.LIST });
    this.showSuccess(code);
    this.refreshItems();
  }

  onGrantsSaved(code: string): void {
    this.syncState({ mode: CatalogDrawerMode.LIST });
    this.showSuccess(code);
  }

  onImported(code: string): void {
    this.showSuccess(code);
    this.refreshItems();
  }

  // ---------------------------------------------------------------------
  // Detail drawer selection + version history
  // ---------------------------------------------------------------------

  selectItem(item: CatalogItemDto, syncUrl = true): void {
    this.selectedItem.set(item);
    this.loadDetail(item.id);
    if (syncUrl) {
      this.syncState({ id: item.id, mode: CatalogDrawerMode.DETAIL });
    }
    this.loadTreeIfNeeded();
  }

  loadDetail(itemId: string): void {
    this.detailLoading.set(true);
    this.detailError.set(false);
    forkJoin({
      item: this.catalog.getItem(itemId, this.scope(), true),
      versions: this.catalog.getVersions(itemId, this.scope())
    }).subscribe({
      next: ({ item, versions }) => {
        if (item.data?.id) {
          this.selectedItem.set(item.data);
        }
        this.versions.set(versions.data?.items ?? []);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailLoading.set(false);
        this.detailError.set(true);
        this.showError(err);
      }
    });
  }

  retryDetail(): void {
    const item = this.selectedItem();
    if (item) {
      this.loadDetail(item.id);
    }
  }

  // ---------------------------------------------------------------------
  // Detail drawer actions (stacked drawers, never modals)
  // ---------------------------------------------------------------------

  onDetailEdit(item: CatalogItemDto): void {
    this.openEditItem(item);
  }

  onDetailAddParent(item: CatalogItemDto): void {
    this.openEdgeDrawer(item);
  }

  onDetailCloseValidity(item: CatalogItemDto): void {
    this.askCloseItem(item);
  }

  onDetailEdgeRemoved(res: ApiResponse<null>): void {
    this.showSuccess(res.code, res.params);
    this.refreshItems();
  }

  // ---------------------------------------------------------------------
  // Tree / multi-parent views
  // ---------------------------------------------------------------------

  private loadTreeIfNeeded(): void {
    if (this.viewMode() !== CatalogViewMode.TREE) {
      return;
    }
    const item = this.selectedItem();
    if (!item) {
      this.descendants.set([]);
      return;
    }
    this.treeLoading.set(true);
    this.catalog.getDescendants(item.id, TREE_DEPTH, this.scope()).subscribe({
      next: (res) => {
        this.descendants.set(res.data?.items ?? []);
        this.treeLoading.set(false);
      },
      error: (err) => {
        this.descendants.set([]);
        this.treeLoading.set(false);
        this.showError(err);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Close validity (relation removal lives in the detail drawer)
  // ---------------------------------------------------------------------

  askCloseItem(item: CatalogItemDto): void {
    if (!this.canMutateItem(item)) {
      return;
    }
    this.selectedItem.set(item);
    this.syncState({ id: item.id, mode: CatalogDrawerMode.CLOSE });
  }

  cancelCloseItem(): void {
    this.syncState({ mode: CatalogDrawerMode.LIST });
  }

  confirmCloseItem(): void {
    const item = this.confirmClose();
    if (!item || this.closingItem()) {
      return;
    }
    this.closingItem.set(true);
    this.catalog.closeItem(item.id, this.scope()).subscribe({
      next: (res) => {
        this.closingItem.set(false);
        this.selectedItem.set(null);
        this.versions.set([]);
        this.pendingState = this.pendingState ? { ...this.pendingState, id: null, mode: CatalogDrawerMode.LIST } : null;
        this.syncState({ id: null, mode: CatalogDrawerMode.LIST });
        this.showSuccess(res.code, res.params);
        this.refreshItems();
      },
      error: (err) => {
        this.closingItem.set(false);
        this.showError(err);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Feedback
  // ---------------------------------------------------------------------

  showSuccess(code: string, params?: Record<string, unknown>): void {
    this.successText.set(this.i18n.t(code, params));
    this.errorText.set('');
  }

  private showError(err: unknown): void {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
    this.successText.set('');
  }
}
