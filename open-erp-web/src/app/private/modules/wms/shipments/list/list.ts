import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import {
  WmsService,
  Shipment,
  ShipmentStatus,
} from '../../../../../../core/services/wms/wms.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'shipment-list',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    SelectModule,
    DrawerModule,
    MpToolbar,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentList implements OnInit, OnDestroy {
  private readonly wmsService = inject(WmsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  protected readonly statusOptions = Object.values(ShipmentStatus).map((s) => ({
    label: s,
    value: s,
  }));

  shipments = signal<Shipment[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  selectedStatus = signal<ShipmentStatus | undefined>(undefined);
  selectedShipment = signal<Shipment | null>(null);
  drawerVisible = signal(false);
  isMobile = signal(false);

  private resizeHandler: (() => void) | null = null;

  constructor() {
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      this.currentPage.set(page);
      this.pageSize.set(PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0]);
      this.loadShipments();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  loadShipments() {
    this.loading.set(true);
    this.wmsService
      .getShipments({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: this.selectedStatus(),
      })
      .subscribe({
        next: (result) => {
          this.shipments.set(result.items);
          this.totalRecords.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected refresh() {
    this.loadShipments();
  }

  protected onStatusChange(status: ShipmentStatus | undefined) {
    this.selectedStatus.set(status);
    this.loadShipments();
  }

  protected openDetail(shipment: Shipment) {
    this.selectedShipment.set(shipment);
    this.drawerVisible.set(true);
  }

  protected closeDrawer() {
    this.drawerVisible.set(false);
    this.selectedShipment.set(null);
  }

  protected getStatusSeverity(
    status: ShipmentStatus,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<ShipmentStatus, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      [ShipmentStatus.DELIVERED]: 'success',
      [ShipmentStatus.SHIPPED]: 'success',
      [ShipmentStatus.IN_TRANSIT]: 'info',
      [ShipmentStatus.PENDING]: 'info',
      [ShipmentStatus.PARTIAL]: 'warn',
      [ShipmentStatus.RETURNED]: 'warn',
      [ShipmentStatus.CANCELLED]: 'danger',
      [ShipmentStatus.DRAFT]: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
}
