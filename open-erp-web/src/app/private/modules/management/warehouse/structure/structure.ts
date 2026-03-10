import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { SelectButtonModule } from 'primeng/selectbutton';

import { WarehouseService } from '../../../../../../core/services/warehouse/warehouse.service';
import type {
  Bin,
  Aisle,
  Zone,
  AisleWithBins,
  ZoneWithAisles,
  WarehouseStructure,
  CreateZoneDto,
  CreateAisleDto,
  CreateBinDto,
} from '../../../../../../core/services/warehouse/warehouse.service';

@Component({
  selector: 'warehouse-structure-explorer',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ProgressSpinnerModule,
    TagModule,
    DialogModule,
    DrawerModule,
    SelectButtonModule,
  ],
  templateUrl: './structure.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseStructureExplorer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly warehouseService = inject(WarehouseService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  protected warehouseId = '';
  protected readonly isLoading = signal(false);
  protected readonly isVisible = signal(true);
  protected readonly structure = signal<WarehouseStructure | null>(null);

  // View mode: 'tree' or 'map'
  protected viewMode = 'tree';
  protected readonly viewModeOptions = [
    { label: '☰ Tree', value: 'tree' },
    { label: '⬛ Map', value: 'map' },
  ];

  // Selected items for detail panel
  protected readonly selectedZone = signal<ZoneWithAisles | null>(null);
  protected readonly selectedAisle = signal<AisleWithBins | null>(null);

  // Dialog states
  protected readonly showZoneDialog = signal(false);
  protected readonly showAisleDialog = signal(false);
  protected readonly showBinDialog = signal(false);

  // Form models
  protected zoneForm: Partial<CreateZoneDto> = {};
  protected aisleForm: Partial<CreateAisleDto> = {};
  protected binForm: Partial<CreateBinDto> = {};

  // Current parent IDs for creating children
  protected currentZoneId: string | null = null;
  protected currentAisleId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.warehouseId = params.get('id') || '';
      if (this.warehouseId) {
        this.loadStructure();
      }
    });
  }

  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to the warehouse list (:scope/:search/:page/:limit)
    // Route depth from here: structure → :id → :limit (WarehouseList) — 2 levels up
    this.router.navigate(['../..'], { relativeTo: this.route });
  }

  protected loadStructure(): void {
    if (!this.warehouseId) return;

    this.isLoading.set(true);
    this.warehouseService.getWarehouseStructure(this.warehouseId).subscribe({
      next: (data) => {
        this.structure.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('common.error'),
          detail: this.translocoService.translate('warehouseStructure.loadError'),
        });
      },
    });
  }

  // Zone actions
  protected onAddZone(): void {
    this.zoneForm = {};
    this.showZoneDialog.set(true);
  }

  protected onSaveZone(): void {
    if (!this.warehouseId || !this.zoneForm.code || !this.zoneForm.name) return;

    this.warehouseService.createZone(this.warehouseId, this.zoneForm as CreateZoneDto).subscribe({
      next: () => {
        this.showZoneDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('warehouseStructure.zoneCreated'),
        });
        this.loadStructure();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('common.error'),
          detail:
            err?.error?.message ||
            this.translocoService.translate('warehouseStructure.createError'),
        });
      },
    });
  }

  // Aisle actions
  protected onAddAisle(zoneId: string): void {
    this.currentZoneId = zoneId;
    this.aisleForm = {};
    this.showAisleDialog.set(true);
  }

  protected onSaveAisle(): void {
    if (!this.currentZoneId || !this.aisleForm.code || !this.aisleForm.name) return;

    this.warehouseService
      .createAisle(this.currentZoneId, this.aisleForm as CreateAisleDto)
      .subscribe({
        next: () => {
          this.showAisleDialog.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('common.success'),
            detail: this.translocoService.translate('warehouseStructure.aisleCreated'),
          });
          this.loadStructure();
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('common.error'),
            detail:
              err?.error?.message ||
              this.translocoService.translate('warehouseStructure.createError'),
          });
        },
      });
  }

  // Bin actions
  protected onAddBin(aisleId: string): void {
    this.currentAisleId = aisleId;
    this.binForm = {};
    this.showBinDialog.set(true);
  }

  protected onSaveBin(): void {
    if (!this.currentAisleId || !this.binForm.code) return;

    this.warehouseService.createBin(this.currentAisleId, this.binForm as CreateBinDto).subscribe({
      next: () => {
        this.showBinDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('warehouseStructure.binCreated'),
        });
        this.loadStructure();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('common.error'),
          detail:
            err?.error?.message ||
            this.translocoService.translate('warehouseStructure.createError'),
        });
      },
    });
  }

  protected onDeleteZone(zoneId: string): void {
    this.warehouseService.deleteZone(zoneId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('warehouseStructure.deleted'),
        });
        this.loadStructure();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('common.error'),
          detail:
            err?.error?.message ||
            this.translocoService.translate('warehouseStructure.deleteError'),
        });
      },
    });
  }

  protected onDeleteAisle(aisleId: string): void {
    this.warehouseService.deleteAisle(aisleId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('warehouseStructure.deleted'),
        });
        this.loadStructure();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('common.error'),
          detail:
            err?.error?.message ||
            this.translocoService.translate('warehouseStructure.deleteError'),
        });
      },
    });
  }

  protected onDeleteBin(binId: string): void {
    this.warehouseService.deleteBin(binId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('warehouseStructure.deleted'),
        });
        this.loadStructure();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('common.error'),
          detail:
            err?.error?.message ||
            this.translocoService.translate('warehouseStructure.deleteError'),
        });
      },
    });
  }

  protected onBlockBin(binId: string): void {
    this.warehouseService.blockBin(binId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('warehouseStructure.binBlocked'),
        });
        this.loadStructure();
      },
    });
  }

  protected onUnblockBin(binId: string): void {
    this.warehouseService.unblockBin(binId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('warehouseStructure.binUnblocked'),
        });
        this.loadStructure();
      },
    });
  }

  protected getBinOccupancyClass(bin: Bin): string {
    if (bin.isBlocked)
      return 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300';
    const ratio = bin.capacityQty > 0 ? bin.currentQty / bin.capacityQty : 0;
    if (ratio >= 1)
      return 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300';
    if (ratio >= 0.8)
      return 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300';
    return 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300';
  }

  protected getBinTooltip(bin: Bin): string {
    return bin.code + (bin.barcode ? ' | ' + bin.barcode : '');
  }

  protected getBinMapTooltip(bin: Bin): string {
    const blockedLabel = this.translocoService.translate('warehouseStructure.legendBlocked');
    return (
      bin.code +
      '\n' +
      bin.currentQty +
      '/' +
      bin.capacityQty +
      (bin.isBlocked ? '\n🔒 ' + blockedLabel : '')
    );
  }

  protected getBinMapLabel(bin: Bin): string {
    if (bin.isBlocked) return '🔒';
    const ratio = bin.capacityQty > 0 ? bin.currentQty / bin.capacityQty : 0;
    if (ratio >= 1) return '●';
    if (ratio >= 0.8) return '◕';
    if (ratio > 0) return '◑';
    return '○';
  }

  protected getAllAisles(): AisleWithBins[] {
    const zones = this.structure()?.zones ?? [];
    return zones.flatMap((z) => z.aisles ?? []);
  }
}
