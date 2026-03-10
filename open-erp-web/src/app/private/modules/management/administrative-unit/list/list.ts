import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SplitterModule } from 'primeng/splitter';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleButtonModule } from 'primeng/togglebutton';

// Core components
import { MapComponent } from '../../../../../../core/components/map/map.component';
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';

// Services and types
import { AdministrativeUnitService } from '../services/administrative-unit.service';
import {
  AdministrativeUnit,
  AdministrativeUnitTreeNode,
  AdminUnitTreeResponse,
  AdminUnitType,
} from '../administrative-unit.types';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

@Component({
  selector: 'management-administrative-unit-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    TranslocoModule,
    TreeTableModule,
    ButtonModule,
    InputTextModule,
    MpToolbar,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    SplitterModule,
    CheckboxModule,
    PaginationComponent,
    SelectButtonModule,
    ToggleButtonModule,
    MapComponent,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService, ConfirmationService],
})
export class AdministrativeUnitList implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(AdministrativeUnitService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  // Signals for state
  protected readonly treeNodes = signal<AdministrativeUnitTreeNode[]>([]);
  protected readonly selectedNode = signal<AdministrativeUnitTreeNode | null>(null);
  protected readonly selectedNodes = signal<AdministrativeUnitTreeNode[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly searchTerm = signal<string>('');
  protected readonly isMobile = signal<boolean>(false);
  protected readonly mobileSearchExpanded = signal<boolean>(false);

  // Route parameters
  protected readonly filter = signal<string>('all');
  protected readonly page = signal<number>(1);
  protected readonly limit = signal<number>(PAGE_SIZE_OPTIONS[0]);
  protected readonly total = signal<number>(0);
  protected readonly totalPages = signal<number>(0);

  // View mode and filters
  protected readonly viewMode = signal<'2-level' | '3-level'>('3-level');
  protected readonly showLegacy = signal<boolean>(true);
  protected readonly viewModeOptions = computed(() => [
    {
      label: this.translocoService.translate('administrativeUnit.viewMode.2-level'),
      value: '2-level',
      icon: 'pi pi-list',
    },
    {
      label: this.translocoService.translate('administrativeUnit.viewMode.3-level'),
      value: '3-level',
      icon: 'pi pi-sitemap',
    },
  ]);

  // Computed values
  protected readonly selectedGeometry = computed(() => {
    const node = this.selectedNode();
    return node?.data?.geometry || node?.data?.geometrySimplified || null;
  });

  protected readonly hasSelection = computed(() => this.selectedNodes().length > 0);

  // Actions menu items - computed to be reactive
  protected readonly actionsMenuItems = computed<MenuItem[]>(() => [
    {
      label: this.translocoService.translate('administrativeUnit.actions.exportCSV'),
      icon: 'pi pi-file',
      command: () => this.exportCSV(),
    },
    {
      label: this.translocoService.translate('administrativeUnit.actions.exportGeoJSON'),
      icon: 'pi pi-map',
      command: () => this.exportGeoJSON(),
    },
    {
      separator: true,
    },
    {
      label: this.translocoService.translate('administrativeUnit.actions.bulkDelete'),
      icon: 'pi pi-trash',
      command: () => this.bulkDelete(),
      disabled: !this.hasSelection(),
    },
  ]);

  // Context menu items
  protected contextMenuItems = signal<MenuItem[]>([]);

  constructor() {
    // Check if mobile
    effect(
      () => {
        this.isMobile.set(window.innerWidth < 768);
      },
      { allowSignalWrites: true },
    );

    // Watch view mode changes and reload tree
    effect(() => {
      const mode = this.viewMode();
      // Collapse all nodes when switching view mode
      const nodes = this.treeNodes();
      nodes.forEach((node) => {
        node.expanded = false;
        node.children = [];
      });
      this.treeNodes.set([...nodes]);
    });

    // Setup context menu items
    effect(
      () => {
        const t = this.translocoService;
        this.contextMenuItems.set([
          {
            label: t.translate('administrativeUnit.contextMenu.view'),
            icon: 'pi pi-eye',
            command: () => this.viewNode(this.selectedNode()!),
          },
          {
            label: t.translate('administrativeUnit.contextMenu.edit'),
            icon: 'pi pi-pencil',
            command: () => this.editNode(this.selectedNode()!),
          },
          {
            label: t.translate('administrativeUnit.contextMenu.createChild'),
            icon: 'pi pi-plus',
            command: () => this.createChild(this.selectedNode()!),
          },
          {
            separator: true,
          },
          {
            label: t.translate('administrativeUnit.contextMenu.delete'),
            icon: 'pi pi-trash',
            command: () => this.deleteNode(this.selectedNode()!),
            styleClass: 'text-red-500',
          },
        ]);
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    // Load initial data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const treeData = data['treeData'] as AdminUnitTreeResponse;
      if (treeData) {
        this.treeNodes.set(treeData.items);
        this.total.set(treeData.total);
        this.page.set(treeData.page);
        this.limit.set(treeData.limit);
        this.totalPages.set(treeData.totalPages);
      }
    });

    // Subscribe to route parameter changes
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.filter.set(params.get('filter') || 'all');
      this.page.set(parseInt(params.get('page') || '1', 10));
      const limitParam = parseInt(params.get('limit') || PAGE_SIZE_OPTIONS[0].toString(), 10);
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limitParam)
        ? limitParam
        : PAGE_SIZE_OPTIONS[0];
      this.limit.set(normalizedLimit);

      if (this.filter() !== 'all') {
        this.searchTerm.set(this.filter());
      }
    });

    // Listen for window resize
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  /**
   * Handle node expansion - lazy load children
   */
  protected onNodeExpand(event: any): void {
    const node = event.node as AdministrativeUnitTreeNode;

    if (node.children && node.children.length > 0) {
      // Children already loaded
      return;
    }

    // Set loading state
    node.loading = true;

    // Load children with current view mode
    this.service
      .loadChildren(node, this.viewMode())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (children) => {
          node.children = children;
          node.loading = false;
          node.leaf = children.length === 0;
          // Trigger change detection
          this.treeNodes.set([...this.treeNodes()]);
        },
        error: (error) => {
          console.error('Error loading children:', error);
          node.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('administrativeUnit.messages.error'),
            detail: this.translocoService.translate(
              'administrativeUnit.messages.loadChildrenFailed',
            ),
          });
          this.treeNodes.set([...this.treeNodes()]);
        },
      });
  }

  /**
   * Handle node selection
   */
  protected onNodeSelect(event: any): void {
    const node = event.node as AdministrativeUnitTreeNode;
    this.selectedNode.set(node);
  }

  /**
   * Handle node unselect
   */
  protected onNodeUnselect(): void {
    this.selectedNode.set(null);
  }

  /**
   * Handle search
   */
  protected onSearch(): void {
    const term = this.searchTerm().trim();
    const filterValue = term || 'all';

    // Navigate to update the route
    this.router.navigate([
      `/private/modules/management/administrative-unit/${filterValue}/1/${this.limit()}`,
    ]);
  }

  /**
   * Clear search
   */
  protected clearSearch(): void {
    this.searchTerm.set('');
    this.onSearch();
  }

  /**
   * Toggle mobile search
   */
  protected toggleMobileSearch(): void {
    this.mobileSearchExpanded.set(!this.mobileSearchExpanded());
  }

  /**
   * Refresh data
   */
  protected refresh(): void {
    this.loading.set(true);
    this.service
      .getTreeData({
        filter: this.filter(),
        page: this.page(),
        limit: this.limit(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.treeNodes.set(data.items);
          this.total.set(data.total);
          this.totalPages.set(data.totalPages);
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('administrativeUnit.messages.success'),
            detail: this.translocoService.translate('administrativeUnit.messages.refreshed'),
          });
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('administrativeUnit.messages.error'),
            detail: this.translocoService.translate('administrativeUnit.messages.loadFailed'),
          });
        },
      });
  }

  /**
   * View node details
   */
  protected viewNode(node: AdministrativeUnitTreeNode): void {
    const unit = node.data;
    // Determine type from node level in tree
    const nodeType = this.getNodeType(node);
    this.router.navigate([nodeType, unit.code, 'view'], { relativeTo: this.route });
  }

  /**
   * Edit node
   */
  protected editNode(node: AdministrativeUnitTreeNode): void {
    const unit = node.data;
    const nodeType = this.getNodeType(node);
    this.router.navigate([nodeType, unit.code, 'edit'], { relativeTo: this.route });
  }

  /**
   * Create child node
   */
  protected createChild(node: AdministrativeUnitTreeNode): void {
    const unit = node.data;
    const nodeType = this.getNodeType(node);
    // Determine child type based on parent
    const childType = nodeType === 'province' ? 'district' : 'ward';
    this.router.navigate([childType, 'new'], {
      relativeTo: this.route,
      queryParams: {
        [nodeType === 'province' ? 'provinceCode' : 'districtCode']: unit.code,
      },
    });
  }

  /**
   * Delete node
   */
  protected deleteNode(node: AdministrativeUnitTreeNode): void {
    const unit = node.data;
    const nodeType = this.getNodeType(node);
    this.confirmationService.confirm({
      header: this.translocoService.translate('administrativeUnit.confirmDelete.header'),
      message: this.translocoService.translate('administrativeUnit.confirmDelete.message', {
        name: unit.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.service
          .deleteUnit(unit.code, nodeType as any)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: this.translocoService.translate('administrativeUnit.messages.success'),
                detail: this.translocoService.translate(
                  'administrativeUnit.messages.deleteSuccess',
                  {
                    name: unit.name,
                  },
                ),
              });
              this.refresh();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('administrativeUnit.messages.error'),
                detail: this.translocoService.translate('administrativeUnit.messages.deleteFailed'),
              });
            },
          });
      },
    });
  }

  /**
   * Add new root unit (province)
   */
  protected addNewProvince(): void {
    this.router.navigate(['province', 'new'], { relativeTo: this.route });
  }

  /**
   * Get node type based on tree hierarchy
   * Root nodes are provinces, their children are districts, grandchildren are wards
   */
  private getNodeType(node: AdministrativeUnitTreeNode): 'province' | 'district' | 'ward' {
    // Check if this node has a parent by looking at the data
    if (node.data.districtCode) {
      // Has both province and district code = ward
      return 'ward';
    } else if (node.data.provinceCode) {
      // Has only province code = district
      return 'district';
    } else {
      // No parent codes = province (root)
      return 'province';
    }
  }

  /**
   * Export to CSV
   */
  protected exportCSV(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('administrativeUnit.messages.notImplemented'),
      detail: this.translocoService.translate('administrativeUnit.messages.exportSoon'),
    });
  }

  /**
   * Export to GeoJSON
   */
  protected exportGeoJSON(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('administrativeUnit.messages.notImplemented'),
      detail: this.translocoService.translate('administrativeUnit.messages.exportSoon'),
    });
  }

  /**
   * Bulk delete selected nodes
   */
  protected bulkDelete(): void {
    const nodes = this.selectedNodes();
    if (nodes.length === 0) return;

    this.confirmationService.confirm({
      header: this.translocoService.translate('administrativeUnit.confirmDelete.header'),
      message: this.translocoService.translate('administrativeUnit.confirmDelete.bulkMessage', {
        count: nodes.length,
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.messageService.add({
          severity: 'info',
          summary: this.translocoService.translate('administrativeUnit.messages.notImplemented'),
          detail: this.translocoService.translate('administrativeUnit.messages.bulkDeleteSoon'),
        });
      },
    });
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.router.navigate([
      `/private/modules/management/administrative-unit/${this.filter()}/${event.page}/${event.pageSize}`,
    ]);
  }

  /**
   * Handle row actions click
   */
  protected onRowActionsClick(node: AdministrativeUnitTreeNode, event: Event, menu: any): void {
    this.selectedNode.set(node);
    menu.toggle(event);
  }

  /**
   * Get type icon
   */
  protected getTypeIcon(type: AdminUnitType): string {
    switch (type) {
      case AdminUnitType.PROVINCE:
        return 'pi pi-map';
      case AdminUnitType.DISTRICT:
        return 'pi pi-building';
      case AdminUnitType.WARD:
        return 'pi pi-map-marker';
      default:
        return 'pi pi-question';
    }
  }

  /**
   * Get type icon from data (without using type field)
   */
  protected getTypeIconFromData(data: AdministrativeUnit): string {
    if (data.districtCode) {
      return 'pi pi-map-marker'; // Ward
    } else if (data.provinceCode) {
      return 'pi pi-building'; // District
    } else {
      return 'pi pi-map'; // Province
    }
  }

  /**
   * Get type label
   */
  protected getTypeLabel(type: AdminUnitType): string {
    return this.translocoService.translate(`administrativeUnit.types.${type}`);
  }

  /**
   * Get type label from data (without using type field)
   */
  protected getTypeLabelFromData(data: AdministrativeUnit): string {
    if (data.districtCode) {
      return this.translocoService.translate('administrativeUnit.types.ward');
    } else if (data.provinceCode) {
      return this.translocoService.translate('administrativeUnit.types.district');
    } else {
      return this.translocoService.translate('administrativeUnit.types.province');
    }
  }

  /**
   * Called when a child route component deactivates (e.g. form closes).
   * Triggers a list refresh so changes are reflected immediately.
   */
  protected onChildDeactivated(): void {
    this.refresh();
  }
}
