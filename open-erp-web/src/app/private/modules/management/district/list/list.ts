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
  ChangeDetectorRef,
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
import { Select } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SplitterModule } from 'primeng/splitter';

// Core components and constants
import { MapComponent } from '../../../../../../core/components/map/map.component';
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';

// Services
import { DistrictService } from '../services/district.service';
import { ProvinceService } from '../../province/services/province.service';
import { District } from '../district.types';
import { Province } from '../../province/province.types';

@Component({
  selector: 'management-district-list',
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
    Select,
    ConfirmDialogModule,
    SplitterModule,
    MapComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistrictList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private districtService = inject(DistrictService);
  private provinceService = inject(ProvinceService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // State signals
  protected readonly districts = signal<District[]>([]);
  protected readonly selectedDistrict = signal<District | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);
  protected readonly provinces = signal<Province[]>([]);
  protected readonly selectedProvinceCode = signal<string>('all-provinces');

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly selectedGeometry = computed(() => {
    const district = this.selectedDistrict();
    if (!district) return null;

    // Return geometry if available
    if (district.geometry) return district.geometry;

    // Convert centroid to GeoJSON Point if available
    if (district.centroid) {
      const centroidPoint: GeoJSON.Point = {
        type: 'Point',
        coordinates: [district.centroid.lon, district.centroid.lat],
      };
      return centroidPoint;
    }

    return null;
  });

  // Province filter options for dropdown
  protected readonly provinceOptions = computed(() => {
    const provs = this.provinces();
    return [
      {
        label: this.translocoService.translate('districtList.filter.allProvinces'),
        value: 'all-provinces',
      },
      ...provs.map((p) => ({ label: p.name, value: p.code })),
    ];
  });

  // Actions menu items
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('districtList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        label: this.translocoService.translate('districtList.actions.exportGeoJSON'),
        icon: 'pi pi-map',
        command: () => this.onExportGeoJSON(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('districtList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const district = this.selectedDistrict();
    if (!district) return [];

    return [
      {
        label: this.translocoService.translate('districtList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewDistrict(district),
      },
      {
        label: this.translocoService.translate('districtList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditDistrict(district),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('districtList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteDistrict(district),
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
    // Load data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const districtListData = data['districtList'];
      if (districtListData) {
        this.districts.set(districtListData.items);
        this.totalRecords.set(districtListData.total);
        this.isLoading.set(false);
      }

      if (data['provinceList']) {
        this.provinces.set(data['provinceList'].items);
      }

      this.cdr.markForCheck();
    });

    // Subscribe to route params for pagination and filters
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['filter'] || '';
      const provinceFilter = params['provinceFilter'] || 'all-provinces';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === 'all' ? '' : search);
      this.selectedProvinceCode.set(provinceFilter);
      this.cdr.markForCheck();
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
    this.router.navigate(
      ['../../../..', this.selectedProvinceCode(), input.value || 'all', 1, this.pageSize()],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Handle province filter change
   */
  protected onProvinceFilterChange(event: any): void {
    const provinceCode = event.value;
    this.router.navigate(
      ['../../../..', provinceCode, this.searchQuery() || 'all', 1, this.pageSize()],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: { page: number; pageSize: number }): void {
    const newPage = event.page;
    const newPageSize = event.pageSize;

    this.router.navigate(
      [
        '../../../..',
        this.selectedProvinceCode(),
        this.searchQuery() || 'all',
        newPage,
        newPageSize,
      ],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Navigate to add new district
   */
  protected onAddDistrict(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export districts to CSV
   */
  protected onExportCSV(): void {
    const params = {
      q: this.searchQuery() || undefined,
      provinceCode:
        this.selectedProvinceCode() !== 'all-provinces' ? this.selectedProvinceCode() : undefined,
    };

    this.districtService.exportToCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `districts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('districtList.messages.success'),
          detail: this.translocoService.translate('districtList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('districtList.messages.error'),
          detail: this.translocoService.translate('districtList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Export districts to GeoJSON
   */
  protected onExportGeoJSON(): void {
    const params = {
      q: this.searchQuery() || undefined,
      provinceCode:
        this.selectedProvinceCode() !== 'all-provinces' ? this.selectedProvinceCode() : undefined,
    };

    this.districtService.exportToGeoJSON(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `districts-${new Date().toISOString().split('T')[0]}.geojson`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('districtList.messages.success'),
          detail: this.translocoService.translate('districtList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('districtList.messages.error'),
          detail: this.translocoService.translate('districtList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import districts (placeholder)
   */
  protected onImport(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('districtList.messages.notImplemented'),
      detail: this.translocoService.translate('districtList.messages.importSoon'),
    });
  }

  /**
   * Handle row click to select district and show on map
   */
  protected onRowClick(district: District): void {
    this.selectedDistrict.set(district);
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, district: District): void {
    event.preventDefault();
    this.selectedDistrict.set(district);
    this.contextMenu.show(event);
  }

  /**
   * View district details
   */
  protected onViewDistrict(district: District): void {
    this.router.navigate([district.code], { relativeTo: this.route });
  }

  /**
   * Edit district
   */
  protected onEditDistrict(district: District): void {
    this.router.navigate([district.code, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete a district
   */
  protected onDeleteDistrict(district: District): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('districtList.confirmDelete.header'),
      message: this.translocoService.translate('districtList.confirmDelete.message', {
        name: district.name || district.nameEn,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('districtList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('districtList.confirmDelete.reject'),
      accept: () => {
        this.districtService.deleteDistrict(district.code).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('districtList.messages.success'),
              detail: this.translocoService.translate('districtList.messages.deleteSuccess', {
                name: district.name || district.nameEn,
              }),
            });
            if (this.selectedDistrict()?.code === district.code) {
              this.selectedDistrict.set(null);
            }
          },
          error: (error) => {
            console.error('Delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('districtList.messages.error'),
              detail: this.translocoService.translate('districtList.messages.deleteFailed'),
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
    this.router.navigate(['../../../..', this.selectedProvinceCode(), 'all', 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Refresh district list
   */
  protected onRefresh(): void {
    window.location.reload();
  }

  /**
   * Navigate to previous page
   */
  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.router.navigate(
        [
          '../../../..',
          this.selectedProvinceCode(),
          this.searchQuery() || 'all',
          newPage,
          this.pageSize(),
        ],
        {
          relativeTo: this.route,
        }
      );
    }
  }

  /**
   * Navigate to next page
   */
  protected onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newPage = this.currentPage() + 1;
      this.router.navigate(
        [
          '../../../..',
          this.selectedProvinceCode(),
          this.searchQuery() || 'all',
          newPage,
          this.pageSize(),
        ],
        {
          relativeTo: this.route,
        }
      );
    }
  }

  /**
   * Change page size
   */
  protected onPageSizeChangeMobile(event: { value: number }): void {
    const newPageSize = event.value;
    this.router.navigate(
      ['../../../..', this.selectedProvinceCode(), this.searchQuery() || 'all', 1, newPageSize],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(district: District): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('districtList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewDistrict(district),
      },
      {
        label: this.translocoService.translate('districtList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditDistrict(district),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('districtList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteDistrict(district),
      },
    ];
  }
}
