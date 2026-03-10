import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { Subject, takeUntil } from 'rxjs';
import {
  WmsService,
  Shipment,
  ShipmentStatus,
} from '../../../../../../core/services/wms/wms.service';

@Component({
  selector: 'shipment-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    DrawerModule,
    TextareaModule,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly wmsService = inject(WmsService);
  private readonly destroy$ = new Subject<void>();

  protected readonly ShipmentStatus = ShipmentStatus;

  drawerVisible = signal(false);
  drawerStyle = computed(() => ({ width: this.isMobile() ? '100vw' : '560px' }));
  isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  shipment = signal<Shipment | null>(null);
  loading = signal(false);

  shipmentForm!: FormGroup;

  constructor() {
    afterNextRender(() => this.drawerVisible.set(true));
  }

  ngOnInit() {
    this.initForm();

    const shipmentData = this.route.snapshot.data['shipment'] as Shipment;
    if (shipmentData) {
      this.shipment.set(shipmentData);
      this.populateForm(shipmentData);
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loading.set(true);
        this.wmsService
          .getShipmentById(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (data) => {
              this.shipment.set(data);
              this.populateForm(data);
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onDrawerHide() {
    if (this.drawerVisible()) {
      this.drawerVisible.set(false);
    }
    this.navigateToList();
  }

  private initForm() {
    this.shipmentForm = this.fb.group({
      carrier: [{ value: '', disabled: true }],
      trackingNumber: [{ value: '', disabled: true }],
      recipientName: [{ value: '', disabled: true }],
      recipientAddress: [{ value: '', disabled: true }],
      notes: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      shippedAt: [{ value: '', disabled: true }],
      deliveredAt: [{ value: '', disabled: true }],
    });
  }

  private populateForm(shipment: Shipment) {
    this.shipmentForm.patchValue({
      carrier: shipment.carrier || '',
      trackingNumber: shipment.trackingNumber || '',
      recipientName: shipment.recipientName || '',
      recipientAddress: shipment.recipientAddress || '',
      notes: shipment.notes || '',
      status: shipment.status,
      shippedAt: shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleString() : '',
      deliveredAt: shipment.deliveredAt ? new Date(shipment.deliveredAt).toLocaleString() : '',
    });
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

  private navigateToList() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
