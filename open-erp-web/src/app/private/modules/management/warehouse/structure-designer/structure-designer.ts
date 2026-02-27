import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ElementRef,
  ViewChild,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { WarehouseService } from '../../../../../../core/services/warehouse/warehouse.service';
import type {
  WarehouseLayout,
  LayoutObject,
  LayoutObjectType,
  CreateLayoutDto,
  CreateLayoutObjectDto,
} from '../../../../../../core/services/warehouse/warehouse.service';

/** Supported draw modes */
export type DrawMode = 'select' | 'zone' | 'aisle' | 'bin';

/** In-memory canvas state for a single object */
export interface CanvasObject extends LayoutObject {
  /** Whether this is a newly added (unsaved) object */
  isDirty?: boolean;
}

const GRID_SNAP_M = 0.5; // snap to 0.5 m

@Component({
  selector: 'warehouse-structure-designer',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TooltipModule,
    ProgressSpinnerModule,
    TagModule,
    DialogModule,
    DrawerModule,
    SelectModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './structure-designer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructureDesigner implements OnInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly warehouseService = inject(WarehouseService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translocoService = inject(TranslocoService);

  // ─── State ────────────────────────────────────────────────────────────────

  protected warehouseId = '';
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isVisible = signal(true);

  protected readonly layout = signal<WarehouseLayout | null>(null);
  protected readonly objects = signal<CanvasObject[]>([]);

  /** Currently selected object */
  protected readonly selectedObject = signal<CanvasObject | null>(null);

  /** Show the inspector panel */
  protected readonly showInspector = signal(false);

  /** Show layout init dialog (first time setup) */
  protected readonly showInitDialog = signal(false);

  /** Show add-object dialog */
  protected readonly showObjectDialog = signal(false);

  /** Draw mode */
  protected drawMode = signal<DrawMode>('select');

  // Canvas transform
  protected scale = signal(50); // pixels per meter
  protected panX = signal(0);
  protected panY = signal(0);

  // Layout init form
  protected initForm: Partial<CreateLayoutDto> = { widthM: 50, lengthM: 30 };

  // Object form
  protected objectForm: Partial<CreateLayoutObjectDto> = {};
  protected objectDialogMode: 'create' | 'edit' = 'create';

  // Drawing in progress
  private drawStart: { x: number; y: number } | null = null;
  private drawRect = signal<{ x: number; y: number; w: number; h: number } | null>(null);

  // Drag state
  private dragStart: { mouseX: number; mouseY: number; objX: number; objY: number } | null = null;

  // Undo stack (simple: array of snapshots)
  private undoStack: CanvasObject[][] = [];
  private redoStack: CanvasObject[][] = [];
  private readonly undoCount = signal(0);
  private readonly redoCount = signal(0);

  // ─── Computed ─────────────────────────────────────────────────────────────

  protected readonly canvasWidthPx = computed(() => {
    const l = this.layout();
    return l ? l.widthM * this.scale() : 800;
  });

  protected readonly canvasHeightPx = computed(() => {
    const l = this.layout();
    return l ? l.lengthM * this.scale() : 600;
  });

  protected readonly gridLines = computed(() => {
    const l = this.layout();
    const s = this.scale();
    if (!l) return { h: [] as number[], v: [] as number[] };
    const h: number[] = [];
    const v: number[] = [];
    for (let y = 0; y <= l.lengthM; y++) h.push(y * s);
    for (let x = 0; x <= l.widthM; x++) v.push(x * s);
    return { h, v };
  });

  protected readonly zones = computed(() =>
    this.objects().filter((o) => o.type === 'zone'),
  );

  protected readonly aisles = computed(() =>
    this.objects().filter((o) => o.type === 'aisle'),
  );

  protected readonly bins = computed(() =>
    this.objects().filter((o) => o.type === 'bin'),
  );

  protected readonly hasDirty = computed(() =>
    this.objects().some((o) => o.isDirty),
  );

  protected readonly typeOptions = [
    { label: 'Zone', value: 'zone' as LayoutObjectType },
    { label: 'Aisle', value: 'aisle' as LayoutObjectType },
    { label: 'Bin', value: 'bin' as LayoutObjectType },
  ];

  protected readonly modeButtons: Array<{ mode: DrawMode; icon: string }> = [
    { mode: 'select', icon: 'pi pi-cursor' },
    { mode: 'zone', icon: 'pi pi-th-large' },
    { mode: 'aisle', icon: 'pi pi-align-justify' },
    { mode: 'bin', icon: 'pi pi-box' },
  ];

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.warehouseId = params.get('id') || '';
      if (this.warehouseId) {
        this.loadLayout();
      }
    });
  }

  ngOnDestroy(): void {}

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z') {
        event.preventDefault();
        this.undo();
      } else if (event.key === 'y' || (event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        this.redo();
      } else if (event.key === 's') {
        event.preventDefault();
        this.saveAll();
      }
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const sel = this.selectedObject();
      if (sel && document.activeElement?.tagName !== 'INPUT') {
        this.promptDeleteObject(sel);
      }
    }
    if (event.key === 'Escape') {
      this.drawMode.set('select');
      this.drawRect.set(null);
      this.drawStart = null;
    }
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  protected loadLayout(): void {
    if (!this.warehouseId) return;
    this.isLoading.set(true);

    this.warehouseService.getLayout(this.warehouseId).subscribe({
      next: ({ layout, objects }) => {
        this.isLoading.set(false);
        if (!layout) {
          this.showInitDialog.set(true);
        } else {
          this.layout.set(layout);
          this.scale.set(layout.scale || 50);
          this.objects.set(objects.map((o) => ({ ...o, isDirty: false })));
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.showInitDialog.set(true);
      },
    });
  }

  protected onInitLayout(): void {
    const { widthM, lengthM } = this.initForm;
    if (!widthM || !lengthM) return;

    this.isSaving.set(true);
    this.warehouseService
      .createLayout(this.warehouseId, { widthM, lengthM, scale: this.scale() })
      .subscribe({
        next: (layout) => {
          this.isSaving.set(false);
          this.layout.set(layout);
          this.showInitDialog.set(false);
          this.toast('success', this.t('structureDesigner.layoutCreated'));
        },
        error: (err: any) => {
          this.isSaving.set(false);
          this.toast('error', err?.error?.message || this.t('common.error'));
        },
      });
  }

  protected onClose(): void {
    this.isVisible.set(false);
    this.router.navigate(['../../..'], { relativeTo: this.route });
  }

  // ─── Draw mode toolbar ────────────────────────────────────────────────────

  protected setDrawMode(mode: DrawMode): void {
    this.drawMode.set(mode);
    this.drawRect.set(null);
    this.drawStart = null;
  }

  protected modeIcon(mode: DrawMode): string {
    const icons: Record<DrawMode, string> = {
      select: 'pi pi-cursor',
      zone: 'pi pi-th-large',
      aisle: 'pi pi-align-justify',
      bin: 'pi pi-box',
    };
    return icons[mode];
  }

  // ─── Canvas interaction ───────────────────────────────────────────────────

  protected onCanvasMouseDown(event: MouseEvent): void {
    const pos = this.getCanvasPos(event);
    const mode = this.drawMode();

    if (mode === 'select') {
      // Try to pick an object
      const hit = this.hitTest(pos.x, pos.y);
      this.selectedObject.set(hit);
      if (hit) {
        this.showInspector.set(true);
        this.dragStart = {
          mouseX: pos.x,
          mouseY: pos.y,
          objX: hit.x,
          objY: hit.y,
        };
        this.pushUndo();
      }
    } else {
      // Start drawing
      this.drawStart = this.snapToGrid(pos.x, pos.y);
    }
  }

  protected onCanvasMouseMove(event: MouseEvent): void {
    const pos = this.getCanvasPos(event);

    if (this.drawMode() === 'select' && this.dragStart) {
      const sel = this.selectedObject();
      if (!sel) return;

      const dx = (pos.x - this.dragStart.mouseX) / this.scale();
      const dy = (pos.y - this.dragStart.mouseY) / this.scale();
      const snapped = this.snapToGrid(
        this.dragStart.objX + dx,
        this.dragStart.objY + dy,
      );

      // Update in-memory
      this.objects.update((objs) =>
        objs.map((o) =>
          o.id === sel.id ? { ...o, x: snapped.x, y: snapped.y, isDirty: true } : o,
        ),
      );
      this.selectedObject.set({ ...sel, x: snapped.x, y: snapped.y });
    } else if (this.drawStart) {
      const cur = this.getCanvasPos(event);
      const snapped = this.snapToGrid(cur.x, cur.y);
      this.drawRect.set({
        x: Math.min(this.drawStart.x, snapped.x) * this.scale(),
        y: Math.min(this.drawStart.y, snapped.y) * this.scale(),
        w: Math.abs(snapped.x - this.drawStart.x) * this.scale(),
        h: Math.abs(snapped.y - this.drawStart.y) * this.scale(),
      });
    }
  }

  protected onCanvasMouseUp(event: MouseEvent): void {
    if (this.drawMode() !== 'select' && this.drawStart) {
      const pos = this.getCanvasPos(event);
      const snapped = this.snapToGrid(pos.x, pos.y);

      const x = Math.min(this.drawStart.x, snapped.x);
      const y = Math.min(this.drawStart.y, snapped.y);
      const widthM = Math.abs(snapped.x - this.drawStart.x);
      const heightM = Math.abs(snapped.y - this.drawStart.y);

      if (widthM >= 0.5 && heightM >= 0.5) {
        this.objectForm = {
          type: this.drawMode() as LayoutObjectType,
          x,
          y,
          widthM,
          heightM,
          code: this.generateCode(this.drawMode() as LayoutObjectType),
          name: '',
        };
        this.objectDialogMode = 'create';
        this.showObjectDialog.set(true);
      }

      this.drawStart = null;
      this.drawRect.set(null);
    }
    this.dragStart = null;
  }

  // ─── Object management ────────────────────────────────────────────────────

  protected onAddObject(type: LayoutObjectType): void {
    const layout = this.layout();
    this.objectForm = {
      type,
      x: 0,
      y: 0,
      widthM: type === 'zone' ? 10 : type === 'aisle' ? 5 : 2,
      heightM: type === 'zone' ? 8 : type === 'aisle' ? 4 : 1.5,
      code: this.generateCode(type),
      name: '',
    };
    this.objectDialogMode = 'create';
    this.showObjectDialog.set(true);
  }

  protected onEditObject(obj: CanvasObject): void {
    this.objectForm = { ...obj };
    this.objectDialogMode = 'edit';
    this.showObjectDialog.set(true);
  }

  protected onSaveObject(): void {
    const form = this.objectForm;
    if (!form.code || !form.name || !form.type) return;

    if (this.objectDialogMode === 'create') {
      const newObj: CanvasObject = {
        id: `tmp-${Date.now()}`,
        warehouseId: this.warehouseId,
        parentId: form.parentId ?? null,
        type: form.type,
        code: form.code,
        name: form.name,
        x: form.x ?? 0,
        y: form.y ?? 0,
        widthM: form.widthM ?? 1,
        heightM: form.heightM ?? 1,
        rotationDeg: form.rotationDeg ?? 0,
        barcode: form.barcode,
        isBlocked: form.isBlocked ?? false,
        capacityQty: form.capacityQty ?? 0,
        capacityVolume: form.capacityVolume,
        allowedSkuTags: form.allowedSkuTags,
        isDirty: true,
      };
      this.pushUndo();
      this.objects.update((objs) => [...objs, newObj]);
      this.selectedObject.set(newObj);
    } else {
      // Edit existing
      const sel = this.selectedObject();
      if (!sel) return;
      this.pushUndo();
      this.objects.update((objs) =>
        objs.map((o) =>
          o.id === sel.id ? { ...o, ...form, isDirty: true } : o,
        ),
      );
    }

    this.showObjectDialog.set(false);
  }

  protected promptDeleteObject(obj: CanvasObject): void {
    this.confirmationService.confirm({
      message: this.t('structureDesigner.confirmDelete', { code: obj.code }),
      header: this.t('structureDesigner.deleteTitle'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteObject(obj),
    });
  }

  protected deleteObject(obj: CanvasObject): void {
    this.pushUndo();
    if (obj.id.startsWith('tmp-')) {
      // Not yet saved – just remove from list
      this.objects.update((objs) => objs.filter((o) => o.id !== obj.id));
    } else {
      // Saved – call API
      this.warehouseService.deleteLayoutObject(obj.id).subscribe({
        next: () => {
          this.objects.update((objs) => objs.filter((o) => o.id !== obj.id));
          this.toast('success', this.t('structureDesigner.deleted'));
          if (this.selectedObject()?.id === obj.id) {
            this.selectedObject.set(null);
            this.showInspector.set(false);
          }
        },
        error: (err: any) => {
          this.toast('error', err?.error?.message || this.t('common.error'));
        },
      });
    }
    this.selectedObject.set(null);
    this.showInspector.set(false);
  }

  // ─── Save all ─────────────────────────────────────────────────────────────

  protected saveAll(): void {
    const dirty = this.objects().filter((o) => o.isDirty);
    if (!dirty.length) return;

    this.isSaving.set(true);

    const payload = dirty.map((o) => {
      const { isDirty, selected, ...rest } = o as any;
      // Temporary IDs start with 'tmp-' – strip them so backend creates new
      if (o.id.startsWith('tmp-')) {
        const { id, ...noId } = rest;
        return noId;
      }
      return rest;
    });

    this.warehouseService.batchSaveLayoutObjects(this.warehouseId, payload).subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        // Replace tmp IDs with real IDs
        const savedMap = new Map(saved.map((s) => [s.code, s]));
        this.objects.update((objs) =>
          objs.map((o) => {
            const serverObj = savedMap.get(o.code);
            if (serverObj) return { ...serverObj, isDirty: false };
            return { ...o, isDirty: !o.id.startsWith('tmp-') ? false : o.isDirty };
          }),
        );
        this.toast('success', this.t('structureDesigner.saveSuccess'));
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.toast('error', err?.error?.message || this.t('common.error'));
      },
    });
  }

  // ─── Zoom & Pan ───────────────────────────────────────────────────────────

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -5 : 5;
    this.scale.update((s) => Math.max(20, Math.min(200, s + delta)));
  }

  protected zoomIn(): void {
    this.scale.update((s) => Math.min(200, s + 10));
  }

  protected zoomOut(): void {
    this.scale.update((s) => Math.max(20, s - 10));
  }

  protected resetView(): void {
    this.panX.set(0);
    this.panY.set(0);
    const layout = this.layout();
    if (layout) this.scale.set(layout.scale || 50);
  }

  // ─── Undo / Redo ─────────────────────────────────────────────────────────

  private pushUndo(): void {
    this.undoStack.push(this.objects().map((o) => ({ ...o })));
    this.redoStack = [];
    this.undoCount.set(this.undoStack.length);
    this.redoCount.set(0);
  }

  protected undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(this.objects().map((o) => ({ ...o })));
    this.objects.set(prev);
    this.undoCount.set(this.undoStack.length);
    this.redoCount.set(this.redoStack.length);
  }

  protected redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(this.objects().map((o) => ({ ...o })));
    this.objects.set(next);
    this.undoCount.set(this.undoStack.length);
    this.redoCount.set(this.redoStack.length);
  }

  protected readonly canUndo = computed(() => this.undoCount() > 0);
  protected readonly canRedo = computed(() => this.redoCount() > 0);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getCanvasPos(event: MouseEvent): { x: number; y: number } {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left - this.panX();
    const py = event.clientY - rect.top - this.panY();
    return { x: px / this.scale(), y: py / this.scale() };
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.round(x / GRID_SNAP_M) * GRID_SNAP_M,
      y: Math.round(y / GRID_SNAP_M) * GRID_SNAP_M,
    };
  }

  private hitTest(xM: number, yM: number): CanvasObject | null {
    const objs = this.objects();
    // Iterate in reverse so top-most objects are picked first
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (xM >= o.x && xM <= o.x + o.widthM && yM >= o.y && yM <= o.y + o.heightM) {
        return o;
      }
    }
    return null;
  }

  private generateCode(type: LayoutObjectType): string {
    const prefix = type === 'zone' ? 'Z' : type === 'aisle' ? 'A' : 'B';
    const existing = this.objects().filter((o) => o.type === type);
    return `${prefix}-${String(existing.length + 1).padStart(3, '0')}`;
  }

  protected getObjectClass(obj: CanvasObject): string {
    const typeClass: Record<LayoutObjectType, string> = {
      zone: 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600',
      aisle: 'bg-purple-100 dark:bg-purple-900 border-purple-400 dark:border-purple-600',
      bin: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600',
    };
    const base = typeClass[obj.type] ?? '';
    const selectedClass =
      this.selectedObject()?.id === obj.id
        ? ' ring-2 ring-primary ring-offset-1 dark:ring-offset-surface-900'
        : '';
    const dirtyClass = obj.isDirty ? ' border-dashed' : '';
    return `${base}${selectedClass}${dirtyClass}`;
  }

  protected trackById(index: number, obj: CanvasObject): string {
    return obj.id;
  }

  private t(key: string, params?: any): string {
    return this.translocoService.translate(key, params);
  }

  private toast(severity: string, detail: string): void {
    this.messageService.add({
      severity,
      summary: severity === 'error' ? this.t('common.error') : this.t('common.success'),
      detail,
      life: 3000,
    });
  }
}
