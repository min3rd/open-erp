import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// PrimeNG imports
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { SplitterModule } from 'primeng/splitter';

// Core components
import { MapComponent } from '../../../../../../core/components/map/map.component';

// Services and types
import { ProvinceService } from '../../province/services/province.service';
import { WardService } from '../../ward/services/ward.service';
import { Province } from '../../province/province.types';
import { Ward } from '../../ward/ward.types';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

/**
 * Admin Units List Component
 * Displays provinces as accordion panels with wards inside each panel
 */
@Component({
  selector: 'management-admin-units-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    TranslocoModule,
    AccordionModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    ToastModule,
    TableModule,
    CardModule,
    SplitterModule,
    MapComponent,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService, ConfirmationService],
})
export class AdminUnitsList implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly provinceService = inject(ProvinceService);
  private readonly wardService = inject(WardService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  // Signals for state
  protected readonly provinces = signal<Province[]>([]);
  protected readonly activeProvinceCode = signal<string | null>(null);
  protected readonly globalSearch = signal<string>('');
  protected readonly loading = signal<boolean>(false);
  protected readonly isMobile = signal<boolean>(false);

  // Bound event handler for cleanup
  private readonly resizeHandler = this.onResize.bind(this);

  // Ward state per province (map of provinceCode -> ward data)
  protected readonly provinceWards = signal<Map<string, Ward[]>>(new Map());
  protected readonly provinceWardSearch = signal<Map<string, string>>(new Map());
  protected readonly provinceWardPage = signal<Map<string, number>>(new Map());
  protected readonly provinceWardTotal = signal<Map<string, number>>(new Map());
  protected readonly provinceWardLoading = signal<Set<string>>(new Set());

  // Computed values
  protected readonly filteredProvinces = computed(() => {
    const search = this.globalSearch().toLowerCase().trim();
    if (!search) return this.provinces();
    
    return this.provinces().filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.code.toLowerCase().includes(search)
    );
  });

  protected readonly activeProvince = computed(() => {
    const code = this.activeProvinceCode();
    if (!code) return null;
    return this.provinces().find(p => p.code === code) || null;
  });

  protected readonly selectedGeometry = computed(() => {
    const province = this.activeProvince();
    return province?.geometry || null;
  });

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // Action menu items
  protected readonly actionsMenuItems = computed<MenuItem[]>(() => [
    {
      label: this.translocoService.translate('adminUnits.actions.exportCSV'),
      icon: 'pi pi-file',
      command: () => this.exportProvinces('csv'),
    },
    {
      label: this.translocoService.translate('adminUnits.actions.exportGeoJSON'),
      icon: 'pi pi-map',
      command: () => this.exportProvinces('geojson'),
    },
    {
      separator: true,
    },
    {
      label: this.translocoService.translate('adminUnits.actions.refresh'),
      icon: 'pi pi-refresh',
      command: () => this.refreshAll(),
    },
  ]);

  ngOnInit(): void {
    // Initialize mobile state
    this.isMobile.set(window.innerWidth < 768);
    
    // Load initial provinces from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const provinces = data['provinces'] as Province[];
      if (provinces) {
        this.provinces.set(provinces);
      }
    });

    // Subscribe to query parameter changes for activeProvinceCode and search
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qParams) => {
      const search = qParams.get('search') || '';
      this.globalSearch.set(search);
      
      const activeCode = qParams.get('activeProvinceCode');
      this.activeProvinceCode.set(activeCode);
      
      // If there's an active province code and provinces are loaded, load its wards
      if (activeCode && this.provinces().length > 0) {
        this.loadWardsForProvince(activeCode);
      }
      
      // Parse ward search params (format: wards[provinceCode]=searchTerm)
      const wardSearchMap = new Map<string, string>();
      qParams.keys.forEach(key => {
        const match = key.match(/^wards\[(.+)\]$/);
        if (match) {
          wardSearchMap.set(match[1], qParams.get(key) || '');
        }
      });
      this.provinceWardSearch.set(wardSearchMap);
      
      // Parse page params (format: page[provinceCode]=number)
      const pageMap = new Map<string, number>();
      qParams.keys.forEach(key => {
        const match = key.match(/^page\[(.+)\]$/);
        if (match) {
          pageMap.set(match[1], parseInt(qParams.get(key) || '1', 10));
        }
      });
      this.provinceWardPage.set(pageMap);
    });

    // Listen for window resize
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.resizeHandler);
  }

  private onResize(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  /**
   * Handle accordion tab open
   */
  protected onTabOpen(event: { index: number }): void {
    const index = event.index;
    const province = this.filteredProvinces()[index];
    
    if (province) {
      // Update route to reflect active province
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { activeProvinceCode: province.code },
        queryParamsHandling: 'merge',
      });
      
      // Load wards for this province
      this.loadWardsForProvince(province.code);
    }
  }

  /**
   * Handle accordion tab close
   */
  protected onTabClose(): void {
    // Clear active province from route
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { activeProvinceCode: null },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Load wards for a specific province
   */
  private loadWardsForProvince(provinceCode: string): void {
    // Check if already loading
    const loadingSet = this.provinceWardLoading();
    if (loadingSet.has(provinceCode)) return;
    
    // Mark as loading
    loadingSet.add(provinceCode);
    this.provinceWardLoading.set(new Set(loadingSet));
    
    const searchTerm = this.provinceWardSearch().get(provinceCode) || '';
    const page = this.provinceWardPage().get(provinceCode) || 1;
    
    this.wardService
      .getWards({
        provinceCode,
        q: searchTerm,
        page,
        limit: 100,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const wardsMap = this.provinceWards();
          wardsMap.set(provinceCode, response.items);
          this.provinceWards.set(new Map(wardsMap));
          
          const totalMap = this.provinceWardTotal();
          totalMap.set(provinceCode, response.total);
          this.provinceWardTotal.set(new Map(totalMap));
          
          // Remove from loading
          const loadingSet = this.provinceWardLoading();
          loadingSet.delete(provinceCode);
          this.provinceWardLoading.set(new Set(loadingSet));
        },
        error: (error) => {
          console.error('Error loading wards:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('adminUnits.messages.error'),
            detail: this.translocoService.translate('adminUnits.messages.loadWardsFailed'),
          });
          
          // Remove from loading
          const loadingSet = this.provinceWardLoading();
          loadingSet.delete(provinceCode);
          this.provinceWardLoading.set(new Set(loadingSet));
        },
      });
  }

  /**
   * Handle global province search
   */
  protected onGlobalSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.globalSearch() || null },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Clear global search
   */
  protected clearGlobalSearch(): void {
    this.globalSearch.set('');
    this.onGlobalSearch();
  }

  /**
   * Handle ward search within a province
   */
  protected onWardSearch(provinceCode: string, searchTerm: string): void {
    const searchMap = this.provinceWardSearch();
    searchMap.set(provinceCode, searchTerm);
    this.provinceWardSearch.set(new Map(searchMap));
    
    // Update URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [`wards[${provinceCode}]`]: searchTerm || null },
      queryParamsHandling: 'merge',
    });
    
    // Reload wards
    this.loadWardsForProvince(provinceCode);
  }

  /**
   * Get wards for a province
   */
  protected getWards(provinceCode: string): Ward[] {
    return this.provinceWards().get(provinceCode) || [];
  }

  /**
   * Get ward count for a province
   */
  protected getWardCount(provinceCode: string): number {
    return this.provinceWardTotal().get(provinceCode) || 0;
  }

  /**
   * Check if wards are loading for a province
   */
  protected isLoadingWards(provinceCode: string): boolean {
    return this.provinceWardLoading().has(provinceCode);
  }

  /**
   * Get ward search term for a province
   */
  protected getWardSearchTerm(provinceCode: string): string {
    return this.provinceWardSearch().get(provinceCode) || '';
  }

  /**
   * Add new province
   */
  protected addProvince(): void {
    this.router.navigate(['province', 'new'], { relativeTo: this.route });
  }

  /**
   * Edit province
   */
  protected editProvince(province: Province): void {
    this.router.navigate(['province', province.id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete province
   */
  protected deleteProvince(province: Province): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('adminUnits.confirmDelete.header'),
      message: this.translocoService.translate('adminUnits.confirmDelete.provinceMessage', {
        name: province.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.provinceService
          .deleteProvince(province.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: this.translocoService.translate('adminUnits.messages.success'),
                detail: this.translocoService.translate('adminUnits.messages.provinceDeleted', {
                  name: province.name,
                }),
              });
              // Refresh provinces
              this.refreshProvinces();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('adminUnits.messages.error'),
                detail: this.translocoService.translate('adminUnits.messages.deleteFailed'),
              });
            },
          });
      },
    });
  }

  /**
   * Add new ward to a province
   */
  protected addWard(provinceCode: string): void {
    this.router.navigate(['ward', 'new'], { 
      relativeTo: this.route,
      queryParams: { provinceCode }
    });
  }

  /**
   * Edit ward
   */
  protected editWard(ward: Ward): void {
    this.router.navigate(['ward', ward.code, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete ward
   */
  protected deleteWard(ward: Ward): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('adminUnits.confirmDelete.header'),
      message: this.translocoService.translate('adminUnits.confirmDelete.wardMessage', {
        name: ward.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.wardService
          .deleteWard(ward.code)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: this.translocoService.translate('adminUnits.messages.success'),
                detail: this.translocoService.translate('adminUnits.messages.wardDeleted', {
                  name: ward.name,
                }),
              });
              // Refresh wards for this province
              this.loadWardsForProvince(ward.provinceCode);
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('adminUnits.messages.error'),
                detail: this.translocoService.translate('adminUnits.messages.deleteFailed'),
              });
            },
          });
      },
    });
  }

  /**
   * Export provinces
   */
  protected exportProvinces(format: 'csv' | 'geojson'): void {
    const search = this.globalSearch();
    const params = { search };
    
    const exportObservable = format === 'csv' 
      ? this.provinceService.exportToCSV(params)
      : this.provinceService.exportToGeoJSON(params);
    
    exportObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provinces.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('adminUnits.messages.success'),
          detail: this.translocoService.translate('adminUnits.messages.exported'),
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('adminUnits.messages.error'),
          detail: this.translocoService.translate('adminUnits.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Export wards for a province
   */
  protected exportWards(provinceCode: string, format: 'csv' | 'geojson'): void {
    const search = this.getWardSearchTerm(provinceCode);
    const params = { provinceCode, q: search };
    
    const exportObservable = format === 'csv' 
      ? this.wardService.exportToCSV(params)
      : this.wardService.exportToGeoJSON(params);
    
    exportObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wards-${provinceCode}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('adminUnits.messages.success'),
          detail: this.translocoService.translate('adminUnits.messages.exported'),
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('adminUnits.messages.error'),
          detail: this.translocoService.translate('adminUnits.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Refresh provinces list
   */
  protected refreshProvinces(): void {
    this.loading.set(true);
    this.provinceService
      .getProvinces({ page: 1, limit: 100, search: this.globalSearch() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.provinces.set(response.items);
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('adminUnits.messages.success'),
            detail: this.translocoService.translate('adminUnits.messages.refreshed'),
          });
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('adminUnits.messages.error'),
            detail: this.translocoService.translate('adminUnits.messages.loadFailed'),
          });
        },
      });
  }

  /**
   * Refresh everything (provinces + all loaded wards)
   */
  protected refreshAll(): void {
    this.refreshProvinces();
    
    // Refresh wards for active province if any
    const activeCode = this.activeProvinceCode();
    if (activeCode) {
      this.loadWardsForProvince(activeCode);
    }
  }

  /**
   * Handle map click on province
   */
  protected onMapProvinceClick(province: Province): void {
    // Find index of province in filtered list
    const index = this.filteredProvinces().findIndex(p => p.code === province.code);
    if (index >= 0) {
      this.activeProvinceCode.set(province.code);
      this.onTabOpen({ index });
    }
  }
}
