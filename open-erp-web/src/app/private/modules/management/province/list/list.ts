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
import { ProvinceService } from '../services/province.service';
import { Province, GetProvincesParams } from '../province.types';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

@Component({
  selector: 'management-province-list',
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
export class ProvinceList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private provinceService = inject(ProvinceService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;

  // State signals
  protected readonly provinces = signal<Province[]>([]);
  protected readonly selectedProvince = signal<Province | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly selectedGeometry = computed(() => this.selectedProvince()?.geometry || null);

  // Actions menu items
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('provinceList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        label: this.translocoService.translate('provinceList.actions.exportGeoJSON'),
        icon: 'pi pi-map',
        command: () => this.onExportGeoJSON(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('provinceList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const province = this.selectedProvince();
    if (!province) return [];

    return [
      {
        label: this.translocoService.translate('provinceList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewProvince(province),
      },
      {
        label: this.translocoService.translate('provinceList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditProvince(province),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('provinceList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteProvince(province),
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
      const provinceListData = data['provinceList'];
      if (provinceListData) {
        this.provinces.set(provinceListData.items);
        this.totalRecords.set(provinceListData.total);
        this.isLoading.set(false);
      }
    });

    // Subscribe to route params for pagination
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['filter'] || '';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === 'all' ? '' : search);
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
   * Handle search input changes
   */
  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.router.navigate(['../../..', input.value || 'all', 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: { page: number; pageSize: number }): void {
    const newPage = event.page;
    const newPageSize = event.pageSize;

    this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Navigate to add new province
   */
  protected onAddProvince(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export provinces to CSV
   */
  protected onExportCSV(): void {
    const params: GetProvincesParams = {
      search: this.searchQuery() || undefined,
    };

    this.provinceService.exportToCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provinces-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('provinceList.messages.success'),
          detail: this.translocoService.translate('provinceList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('provinceList.messages.error'),
          detail: this.translocoService.translate('provinceList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Export provinces to GeoJSON
   */
  protected onExportGeoJSON(): void {
    const params: GetProvincesParams = {
      search: this.searchQuery() || undefined,
    };

    this.provinceService.exportToGeoJSON(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provinces-${new Date().toISOString().split('T')[0]}.geojson`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('provinceList.messages.success'),
          detail: this.translocoService.translate('provinceList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('provinceList.messages.error'),
          detail: this.translocoService.translate('provinceList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import provinces (placeholder)
   */
  protected onImport(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('provinceList.messages.notImplemented'),
      detail: this.translocoService.translate('provinceList.messages.importSoon'),
    });
  }

  /**
   * Handle row click to select province and show on map
   */
  protected onRowClick(province: Province): void {
    this.selectedProvince.set(province);
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, province: Province): void {
    event.preventDefault();
    this.selectedProvince.set(province);
    this.contextMenu.show(event);
  }

  /**
   * View province details
   */
  protected onViewProvince(province: Province): void {
    this.router.navigate([province.code], { relativeTo: this.route });
  }

  /**
   * Edit province
   */
  protected onEditProvince(province: Province): void {
    this.router.navigate([province.code, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete a province
   */
  protected onDeleteProvince(province: Province): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('provinceList.confirmDelete.header'),
      message: this.translocoService.translate('provinceList.confirmDelete.message', {
        name: province.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('provinceList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('provinceList.confirmDelete.reject'),
      accept: () => {
        this.provinceService.deleteProvince(province.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('provinceList.messages.success'),
              detail: this.translocoService.translate('provinceList.messages.deleteSuccess', {
                name: province.name,
              }),
            });
            if (this.selectedProvince()?.id === province.id) {
              this.selectedProvince.set(null);
            }
          },
          error: (error) => {
            console.error('Delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('provinceList.messages.error'),
              detail: this.translocoService.translate('provinceList.messages.deleteFailed'),
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
    this.searchQuery.set('');
    this.router.navigate(['../../..', 'all', 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Refresh province list
   */
  protected onRefresh(): void {
    this.provinceService
      .getProvinces({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe();
  }

  /**
   * Navigate to previous page
   */
  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
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
      this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
        relativeTo: this.route,
      });
    }
  }

  /**
   * Change page size
   */
  protected onPageSizeChangeMobile(event: { value: number }): void {
    const newPageSize = event.value;
    this.router.navigate(['../../..', this.searchQuery() || 'all', 1, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(province: Province): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('provinceList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewProvince(province),
      },
      {
        label: this.translocoService.translate('provinceList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditProvince(province),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('provinceList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteProvince(province),
      },
    ];
  }
}
