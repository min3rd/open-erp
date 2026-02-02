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
import { Accordion } from 'primeng/accordion';
import { AccordionPanel } from 'primeng/accordion';
import { AccordionHeader } from 'primeng/accordion';
import { AccordionContent } from 'primeng/accordion';
import { Scroller } from 'primeng/scroller';

// Core components and constants
import { MapComponent } from '../../../../../../core/components/map/map.component';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';

// Services
import { WardService } from '../services/ward.service';
import { Ward } from '../ward.types';
import { Province } from '../../province/province.types';
import { District } from '../../district/district.types';

@Component({
  selector: 'management-ward-list',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    SplitterModule,
    MapComponent,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    Scroller,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WardList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private wardService = inject(WardService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // State signals
  protected readonly wards = signal<Ward[]>([]);
  protected readonly selectedWard = signal<Ward | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);
  protected readonly provinces = signal<Province[]>([]);
  protected readonly districts = signal<District[]>([]);
  protected readonly sortOrder = signal<'name:asc' | 'name:desc'>('name:asc');
  protected readonly expandedGroups = signal<Set<string>>(new Set()); // Start empty - all collapsed
  protected readonly activeProvinceCode = signal<string | null>(null);
  
  // Map to store wards per province (lazy loaded)
  protected readonly wardsByProvinceMap = signal<Map<string, { wards: Ward[]; loading: boolean; loaded: boolean }>>(new Map());

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly selectedGeometry = computed(() => {
    const ward = this.selectedWard();
    if (!ward) return null;

    // Return geometry if available
    if (ward.geometry) return ward.geometry;

    // Convert centroid to GeoJSON Point if available
    if (ward.centroid) {
      const centroidPoint: GeoJSON.Point = {
        type: 'Point',
        coordinates: [ward.centroid.lon, ward.centroid.lat],
      };
      return centroidPoint;
    }

    return null;
  });

  // Group wards by province - now based on provinces list, not wards
  protected readonly wardsByProvince = computed(() => {
    const provincesList = this.provinces();
    const wardsMap = this.wardsByProvinceMap();
    
    return provincesList.map((province) => ({
      provinceCode: province.code,
      provinceName: province.name,
      wards: wardsMap.get(province.code)?.wards || [],
      loading: wardsMap.get(province.code)?.loading || false,
      loaded: wardsMap.get(province.code)?.loaded || false,
    }));
  });

  // Active province geometry for map background
  protected readonly activeProvinceGeometry = computed(() => {
    const provinceCode = this.activeProvinceCode();
    if (!provinceCode) return null;

    const province = this.provinces().find((p) => p.code === provinceCode);
    return province?.geometry || null;
  });



  // Actions menu items
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('wardList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        label: this.translocoService.translate('wardList.actions.exportGeoJSON'),
        icon: 'pi pi-map',
        command: () => this.onExportGeoJSON(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('wardList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const ward = this.selectedWard();
    if (!ward) return [];

    return [
      {
        label: this.translocoService.translate('wardList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewWard(ward),
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditWard(ward),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteWard(ward),
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
      if (data['provinceList']) {
        this.provinces.set(data['provinceList'].items);
      }

      if (data['districtList']) {
        this.districts.set(data['districtList'].items);
      }

      this.cdr.markForCheck();
    });

    // Subscribe to route params for provinceCode
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const provinceCode = params['provinceCode'] || null;
      this.activeProvinceCode.set(provinceCode);
      
      // Auto-expand the active province and close all others
      if (provinceCode) {
        this.expandedGroups.set(new Set([provinceCode]));
        this.loadWardsForProvince(provinceCode);
      }
      
      this.cdr.markForCheck();
    });

    // Subscribe to query params for search and sort
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((queryParams) => {
      const search = queryParams['search'] || '';
      const sort = queryParams['sort'] || 'name:asc';
      
      this.searchQuery.set(search);
      this.sortOrder.set(sort as 'name:asc' | 'name:desc');
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
    const value = input.value || '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: value || undefined },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Navigate to add new ward
   */
  protected onAddWard(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export wards to CSV
   */
  protected onExportCSV(): void {
    const params = {
      q: this.searchQuery() || undefined,
      provinceCode: this.activeProvinceCode() || undefined,
    };

    this.wardService.exportToCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wards-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('wardList.messages.success'),
          detail: this.translocoService.translate('wardList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('wardList.messages.error'),
          detail: this.translocoService.translate('wardList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Export wards to GeoJSON
   */
  protected onExportGeoJSON(): void {
    const params = {
      q: this.searchQuery() || undefined,
      provinceCode: this.activeProvinceCode() || undefined,
    };

    this.wardService.exportToGeoJSON(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wards-${new Date().toISOString().split('T')[0]}.geojson`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('wardList.messages.success'),
          detail: this.translocoService.translate('wardList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('wardList.messages.error'),
          detail: this.translocoService.translate('wardList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import wards (placeholder)
   */
  protected onImport(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('wardList.messages.notImplemented'),
      detail: this.translocoService.translate('wardList.messages.importSoon'),
    });
  }

  /**
   * Handle row click to select ward and show on map
   */
  protected onRowClick(ward: Ward): void {
    this.selectedWard.set(ward);
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, ward: Ward): void {
    event.preventDefault();
    this.selectedWard.set(ward);
    this.contextMenu.show(event);
  }

  /**
   * View ward details
   */
  protected onViewWard(ward: Ward): void {
    this.router.navigate([ward.code], { relativeTo: this.route });
  }

  /**
   * Edit ward
   */
  protected onEditWard(ward: Ward): void {
    this.router.navigate([ward.code, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete a ward
   */
  protected onDeleteWard(ward: Ward): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('wardList.confirmDelete.header'),
      message: this.translocoService.translate('wardList.confirmDelete.message', {
        name: ward.name || ward.nameEn,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('wardList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('wardList.confirmDelete.reject'),
      accept: () => {
        this.wardService.deleteWard(ward.code).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('wardList.messages.success'),
              detail: this.translocoService.translate('wardList.messages.deleteSuccess', {
                name: ward.name || ward.nameEn,
              }),
            });
            if (this.selectedWard()?.code === ward.code) {
              this.selectedWard.set(null);
            }
          },
          error: (error) => {
            console.error('Delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('wardList.messages.error'),
              detail: this.translocoService.translate('wardList.messages.deleteFailed'),
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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: undefined },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Refresh ward list
   */
  protected onRefresh(): void {
    window.location.reload();
  }



  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(ward: Ward): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('wardList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewWard(ward),
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditWard(ward),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteWard(ward),
      },
    ];
  }

  /**
   * Handle sort order change
   */
  protected onSortChange(event: any): void {
    const sortValue = event.value as 'name:asc' | 'name:desc';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sortValue },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Toggle sort order between asc and desc
   */
  protected toggleSort(): void {
    const newSort = this.sortOrder() === 'name:asc' ? 'name:desc' : 'name:asc';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: newSort },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Get active values for accordion (all group indexes that are expanded)
   */
  protected getActiveValues(): number[] {
    const expanded = this.expandedGroups();
    const groups = this.wardsByProvince();
    const values: number[] = [];
    
    groups.forEach((group, index) => {
      if (expanded.has(group.provinceCode)) {
        values.push(index);
      }
    });
    
    return values;
  }

  /**
   * Handle accordion value change - only allow one province to be expanded at a time
   */
  protected onAccordionValueChange(value: string | number | string[] | number[] | null | undefined): void {
    const groups = this.wardsByProvince();
    
    // Ensure we have an array of numbers
    const values: number[] = Array.isArray(value) 
      ? value.map(v => typeof v === 'number' ? v : parseInt(String(v), 10)).filter(v => !isNaN(v))
      : [];
    
    // Only allow the most recently selected province to be expanded
    if (values.length > 0) {
      const latestIndex = values[values.length - 1];
      if (latestIndex < groups.length) {
        const provinceCode = groups[latestIndex].provinceCode;
        this.expandedGroups.set(new Set([provinceCode]));
        this.loadWardsForProvince(provinceCode);
        
        // Navigate to update route with provinceCode
        this.router.navigate(['../', provinceCode], {
          queryParamsHandling: 'preserve',
          relativeTo: this.route,
        });
      }
    } else {
      // All collapsed - navigate to first province or stay on current
      this.expandedGroups.set(new Set());
      // Don't navigate away, just collapse
    }
  }

  /**
   * Load wards for a specific province
   */
  private loadWardsForProvince(provinceCode: string): void {
    const currentMap = this.wardsByProvinceMap();
    
    // Check if already loaded or loading
    if (currentMap.get(provinceCode)?.loaded || currentMap.get(provinceCode)?.loading) {
      return;
    }
    
    // Set loading state
    const newMap = new Map(currentMap);
    newMap.set(provinceCode, { wards: [], loading: true, loaded: false });
    this.wardsByProvinceMap.set(newMap);
    
    // Fetch wards for this province
    this.wardService
      .getWards({
        page: 1,
        limit: 10000, // Load all wards for this province
        provinceCode: provinceCode,
        sort: this.sortOrder(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const updatedMap = new Map(this.wardsByProvinceMap());
          updatedMap.set(provinceCode, {
            wards: response.items,
            loading: false,
            loaded: true,
          });
          this.wardsByProvinceMap.set(updatedMap);
        },
        error: (error) => {
          console.error(`Failed to load wards for province ${provinceCode}:`, error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('wardList.messages.error'),
            detail: this.translocoService.translate('wardList.messages.loadFailed'),
          });
          
          // Clear loading state
          const updatedMap = new Map(this.wardsByProvinceMap());
          updatedMap.set(provinceCode, {
            wards: [],
            loading: false,
            loaded: false,
          });
          this.wardsByProvinceMap.set(updatedMap);
        },
      });
  }
}
