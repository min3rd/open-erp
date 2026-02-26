import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ContextMenu } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SplitterModule } from 'primeng/splitter';

// Core components
import { MapComponent } from '../../../../../../core/components/map/map.component';
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';

// Services
import { WarehouseService } from '../../../../../../core/services/warehouse/warehouse.service';
import type { QueryWarehouseParams } from '../../../../../../core/services/warehouse/warehouse.service';
import { Warehouse } from '../warehouse.types';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

interface ScopeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'management-warehouse-list',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    Select,
    PaginationComponent,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    SplitterModule,
    MapComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mapContextMenu') mapContextMenu?: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private warehouseService = inject(WarehouseService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;

  // State signals
  protected readonly warehouses = signal<Warehouse[]>([]);
  protected selectedWarehousesArray: Warehouse[] = []; // For PrimeNG table binding
  protected readonly selectedWarehouse = signal<Warehouse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentScope = signal('all');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly selectedGeometry = computed(() => {
    const warehouse = this.selectedWarehouse();
    if (!warehouse?.location) return null;
    return {
      type: 'Point',
      coordinates: warehouse.location.coordinates
    } as GeoJSON.Point;
  });

  // Map context menu state
  protected readonly mapClickLocation = signal<{ lat: number; lng: number } | null>(null);
  
  // Map context menu items - computed based on click location
  protected readonly mapContextMenuItems = computed<MenuItem[]>(() => {
    const location = this.mapClickLocation();
    if (!location) return [];

    return [
      {
        label: this.translocoService.translate('warehouseList.mapContextMenu.createHere'),
        icon: 'pi pi-plus',
        command: () => this.onCreateWarehouseAtLocation(location),
      },
      {
        label: this.translocoService.translate('warehouseList.mapContextMenu.viewCoordinates'),
        icon: 'pi pi-map-marker',
        command: () => this.showCoordinates(location),
      },
    ];
  });

  // Scope options
  protected readonly scopeOptions: ScopeOption[] = [
    { label: 'All Warehouses', value: 'all' },
    { label: 'My Organization', value: 'org' },
    { label: 'Nearby', value: 'nearby' },
  ];

  // Actions menu items
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('warehouseList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        label: this.translocoService.translate('warehouseList.actions.exportGeoJSON'),
        icon: 'pi pi-map',
        command: () => this.onExportGeoJSON(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('warehouseList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('warehouseList.actions.deleteSelected'),
        icon: 'pi pi-trash',
        disabled: this.selectedWarehousesArray.length === 0,
        command: () => this.onBulkDelete(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const warehouse = this.selectedWarehouse();
    if (!warehouse) return [];

    return [
      {
        label: this.translocoService.translate('warehouseList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewWarehouse(warehouse),
      },
      {
        label: this.translocoService.translate('warehouseList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditWarehouse(warehouse),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('warehouseList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteWarehouse(warehouse),
      },
    ];
  }

  constructor() {
    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }

    // Focus mobile search input when it opens
    effect(() => {
      if (this.isSearchOpen() && this.mobileSearchInput) {
        setTimeout(() => {
          this.mobileSearchInput?.nativeElement?.focus();
        }, this.SEARCH_FOCUS_DELAY);
      }
    });
  }

  ngOnInit(): void {
    // Load data from resolver if available
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const warehouseListData = data['warehouseList'];
      if (warehouseListData) {
        this.warehouses.set(warehouseListData.items);
        this.totalRecords.set(warehouseListData.total);
        this.isLoading.set(false);
      }
    });

    // Subscribe to route params for pagination and filters
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const scope = params['scope'] || 'all';
      const search = params['search'] || '';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.currentScope.set(scope);
      this.searchQuery.set(search === '-' ? '' : search);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Handle scope change
   */
  protected onScopeChange(event: { value: string }): void {
    const newScope = event.value;
    const search = this.searchQuery() || '-';
    this.router.navigate(['../../../..', newScope, search, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Handle search input changes
   */
  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value || '-';
    this.router.navigate(['../../../..', this.currentScope(), searchValue, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: { page: number; pageSize: number }): void {
    const newPage = event.page;
    const newPageSize = event.pageSize;
    const search = this.searchQuery() || '-';

    this.router.navigate(['../../../..', this.currentScope(), search, newPage, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Navigate to add new warehouse
   */
  protected onAddWarehouse(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export warehouses to CSV
   */
  protected onExportCSV(): void {
    const params: QueryWarehouseParams = {
      search: this.searchQuery() || undefined,
    };

    this.warehouseService.exportCSV(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `warehouses-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('warehouseList.messages.success'),
          detail: this.translocoService.translate('warehouseList.messages.exportSuccess'),
        });
      },
      error: (error: any) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('warehouseList.messages.error'),
          detail: this.translocoService.translate('warehouseList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Export warehouses to GeoJSON
   */
  protected onExportGeoJSON(): void {
    const params: QueryWarehouseParams = {
      search: this.searchQuery() || undefined,
    };

    this.warehouseService.exportGeoJSON(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `warehouses-${new Date().toISOString().split('T')[0]}.geojson`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('warehouseList.messages.success'),
          detail: this.translocoService.translate('warehouseList.messages.exportSuccess'),
        });
      },
      error: (error: any) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('warehouseList.messages.error'),
          detail: this.translocoService.translate('warehouseList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import warehouses (placeholder)
   */
  protected onImport(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('warehouseList.messages.notImplemented'),
      detail: this.translocoService.translate('warehouseList.messages.importSoon'),
    });
  }

  /**
   * Bulk delete selected warehouses
   */
  protected onBulkDelete(): void {
    const selected = this.selectedWarehousesArray;
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      header: this.translocoService.translate('warehouseList.confirmBulkDelete.header'),
      message: this.translocoService.translate('warehouseList.confirmBulkDelete.message', {
        count: selected.length,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('warehouseList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('warehouseList.confirmDelete.reject'),
      accept: () => {
        const ids = selected.map((w) => w.id);
        this.warehouseService.bulkDeleteWarehouses(ids).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('warehouseList.messages.success'),
              detail: this.translocoService.translate('warehouseList.messages.bulkDeleteSuccess', {
                count: selected.length,
              }),
            });
            this.selectedWarehousesArray = [];
            this.onRefresh();
          },
          error: (error: any) => {
            console.error('Bulk delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('warehouseList.messages.error'),
              detail: this.translocoService.translate('warehouseList.messages.bulkDeleteFailed'),
            });
          },
        });
      },
    });
  }

  /**
   * Handle row click to select warehouse and show on map
   */
  protected onRowClick(warehouse: Warehouse): void {
    this.selectedWarehouse.set(warehouse);
  }

  /**
   * Handle row selection change
   */
  protected onSelectionChange(): void {
    // This will be called when selection changes via two-way binding
    // No action needed as the array is directly bound
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, warehouse: Warehouse): void {
    event.preventDefault();
    this.selectedWarehouse.set(warehouse);
    this.contextMenu.show(event);
  }

  /**
   * View warehouse details
   */
  protected onViewWarehouse(warehouse: Warehouse): void {
    this.router.navigate([warehouse.id], { relativeTo: this.route });
  }

  /**
   * Edit warehouse
   */
  protected onEditWarehouse(warehouse: Warehouse): void {
    this.router.navigate([warehouse.id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete a warehouse
   */
  protected onDeleteWarehouse(warehouse: Warehouse): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('warehouseList.confirmDelete.header'),
      message: this.translocoService.translate('warehouseList.confirmDelete.message', {
        name: warehouse.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('warehouseList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('warehouseList.confirmDelete.reject'),
      accept: () => {
        this.warehouseService.deleteWarehouse(warehouse.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('warehouseList.messages.success'),
              detail: this.translocoService.translate('warehouseList.messages.deleteSuccess', {
                name: warehouse.name,
              }),
            });
            if (this.selectedWarehouse()?.id === warehouse.id) {
              this.selectedWarehouse.set(null);
            }
            this.onRefresh();
          },
          error: (error: any) => {
            console.error('Delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('warehouseList.messages.error'),
              detail: this.translocoService.translate('warehouseList.messages.deleteFailed'),
            });
          },
        });
      },
    });
  }

  /**
   * Check viewport size to detect mobile
   */
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Toggle search input visibility on mobile
   */
  protected toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  /**
   * Close search on mobile
   */
  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    const search = '-';
    this.router.navigate(['../../../..', this.currentScope(), search, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Refresh warehouse list
   */
  protected onRefresh(): void {
    const params: QueryWarehouseParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery() || undefined,
    };

    this.warehouseService.getWarehouses(params).subscribe({
      next: (data) => {
        this.warehouses.set(data.items);
        this.totalRecords.set(data.total);
      },
    });
  }

  /**
   * Navigate to previous page
   */
  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      const search = this.searchQuery() || '-';
      this.router.navigate(['../../../..', this.currentScope(), search, newPage, this.pageSize()], {
        relativeTo: this.route,
      });
    }
  }

  /**
   * Navigate to next page
   */
  protected onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newPage = this.currentPage() + 1;
      const search = this.searchQuery() || '-';
      this.router.navigate(['../../../..', this.currentScope(), search, newPage, this.pageSize()], {
        relativeTo: this.route,
      });
    }
  }

  /**
   * Change page size
   */
  protected onPageSizeChangeMobile(event: { value: number }): void {
    const newPageSize = event.value;
    const search = this.searchQuery() || '-';
    this.router.navigate(['../../../..', this.currentScope(), search, 1, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(warehouse: Warehouse): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('warehouseList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewWarehouse(warehouse),
      },
      {
        label: this.translocoService.translate('warehouseList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditWarehouse(warehouse),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('warehouseList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteWarehouse(warehouse),
      },
    ];
  }

  /**
   * Handle right-click on map to show context menu
   */
  protected onMapRightClick(event: MouseEvent): void {
    event.preventDefault();
    
    // Get the map container and calculate relative position
    const mapContainer = (event.target as HTMLElement).closest('#warehouse-list-map');
    if (!mapContainer) return;

    const rect = mapContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate approximate lat/lng (this is a simplified calculation)
    // In a real implementation, you'd use the Leaflet map instance
    // For now, store the click event coordinates
    const lat = 15.9749 + (0.5 - y / rect.height) * 20; // Rough approximation
    const lng = 108.2515 + (x / rect.width - 0.5) * 20;

    this.mapClickLocation.set({ lat, lng });
    
    if (this.mapContextMenu) {
      this.mapContextMenu.show(event);
    }
  }

  /**
   * Create warehouse at clicked map location
   */
  protected onCreateWarehouseAtLocation(location: { lat: number; lng: number }): void {
    // Navigate to create form and pass location via query params
    this.router.navigate(['new'], {
      relativeTo: this.route,
      queryParams: {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
      },
    });
  }

  /**
   * Show coordinates in a toast message
   */
  protected showCoordinates(location: { lat: number; lng: number }): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('warehouseList.mapContextMenu.coordinates'),
      detail: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`,
      life: 5000,
    });
  }
}
