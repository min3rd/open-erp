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
export type DrawMode = 'select' | 'zone' | 'aisle' | 'bin' | 'label' | 'corridor' | 'pan';

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
  protected panX = signal(16); // initial 16px margin
  protected panY = signal(16);

  // Panning state
  private isPanning = false;
  private panStart = { clientX: 0, clientY: 0, panX: 0, panY: 0 };

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

  /** Objects sorted by zOrder (lowest first = rendered below others) */
  protected readonly sortedObjects = computed(() =>
    [...this.objects()].sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0)),
  );

  /** Non-zone/aisle/bin objects (labels, corridors) for layers panel */
  protected readonly decorativeObjects = computed(() =>
    this.objects().filter((o) => o.type === 'label' || o.type === 'corridor'),
  );

  protected readonly hasDirty = computed(() =>
    this.objects().some((o) => o.isDirty),
  );

  protected readonly typeOptions = [
    { label: 'Zone', value: 'zone' as LayoutObjectType },
    { label: 'Aisle', value: 'aisle' as LayoutObjectType },
    { label: 'Bin', value: 'bin' as LayoutObjectType },
    { label: 'Label', value: 'label' as LayoutObjectType },
    { label: 'Corridor', value: 'corridor' as LayoutObjectType },
  ];

  protected readonly modeButtons: Array<{ mode: DrawMode; icon: string }> = [
    { mode: 'select', icon: 'pi pi-cursor' },
    { mode: 'pan', icon: 'pi pi-arrows-alt' },
    { mode: 'zone', icon: 'pi pi-th-large' },
    { mode: 'aisle', icon: 'pi pi-align-justify' },
    { mode: 'bin', icon: 'pi pi-box' },
    { mode: 'label', icon: 'pi pi-tag' },
    { mode: 'corridor', icon: 'pi pi-arrows-h' },
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
    this.isPanning = false;
  }

  protected modeIcon(type: string): string {
    const icons: Record<string, string> = {
      select: 'pi pi-cursor',
      pan: 'pi pi-arrows-alt',
      zone: 'pi pi-th-large',
      aisle: 'pi pi-align-justify',
      bin: 'pi pi-box',
      label: 'pi pi-tag',
      corridor: 'pi pi-arrows-h',
    };
    return icons[type] ?? 'pi pi-circle';
  }

  // ─── Canvas interaction ───────────────────────────────────────────────────

  /**
   * Called on mousedown on the main canvas container.
   * Handles: pan mode start (pan button or middle-click), object drag start, draw start.
   */
  protected onMouseDown(event: MouseEvent): void {
    // Middle-click (button=1) or pan mode → start panning
    if (event.button === 1 || this.drawMode() === 'pan') {
      event.preventDefault();
      this.isPanning = true;
      this.panStart = {
        clientX: event.clientX,
        clientY: event.clientY,
        panX: this.panX(),
        panY: this.panY(),
      };
      return;
    }

    // Only left-click for draw/select
    if (event.button !== 0) return;

    const pos = this.getCanvasPos(event);
    if (!pos) return; // clicked outside the canvas area

    const mode = this.drawMode();

    if (mode === 'select') {
      const hit = this.hitTest(pos.x, pos.y);
      this.selectedObject.set(hit);
      if (hit) {
        this.showInspector.set(true);
        this.pushUndo();
        this.dragStart = {
          mouseX: pos.x,
          mouseY: pos.y,
          objX: hit.x,
          objY: hit.y,
        };
      }
    } else {
      // Draw mode — record start point in meters
      this.drawStart = this.snapToGrid(pos.x, pos.y);
    }
  }

  /** Document-level mousemove handles pan, drag and draw-preview simultaneously */
  @HostListener('document:mousemove', ['$event'])
  onGlobalMouseMove(event: MouseEvent): void {
    // ── Pan ──────────────────────────────────────────────────────────────────
    if (this.isPanning) {
      const dx = event.clientX - this.panStart.clientX;
      const dy = event.clientY - this.panStart.clientY;
      this.panX.set(this.panStart.panX + dx);
      this.panY.set(this.panStart.panY + dy);
      return;
    }

    // ── Object drag ──────────────────────────────────────────────────────────
    if (this.dragStart && this.drawMode() === 'select') {
      const sel = this.selectedObject();
      if (!sel) return;

      // Convert client coords to canvas meters (no bounds check needed for drag)
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const posX = (event.clientX - rect.left) / this.scale();
      const posY = (event.clientY - rect.top) / this.scale();

      // Delta is purely in meters — no extra division needed
      const dx = posX - this.dragStart.mouseX;
      const dy = posY - this.dragStart.mouseY;
      const snapped = this.snapToGrid(this.dragStart.objX + dx, this.dragStart.objY + dy);

      this.objects.update((objs) =>
        objs.map((o) =>
          o.id === sel.id ? { ...o, x: snapped.x, y: snapped.y, isDirty: true } : o,
        ),
      );
      this.selectedObject.set({ ...sel, x: snapped.x, y: snapped.y });
      return;
    }

    // ── Draw preview ─────────────────────────────────────────────────────────
    if (this.drawStart) {
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Clamp to canvas bounds for the preview rectangle
      const px = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const py = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
      const snapped = this.snapToGrid(px / this.scale(), py / this.scale());

      this.drawRect.set({
        x: Math.min(this.drawStart.x, snapped.x) * this.scale(),
        y: Math.min(this.drawStart.y, snapped.y) * this.scale(),
        w: Math.abs(snapped.x - this.drawStart.x) * this.scale(),
        h: Math.abs(snapped.y - this.drawStart.y) * this.scale(),
      });
    }
  }

  /** Document-level mouseup ends pan, drag or draw */
  @HostListener('document:mouseup', ['$event'])
  onGlobalMouseUp(event: MouseEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    this.dragStart = null;

    if (this.drawStart) {
      const canvas = this.canvasRef?.nativeElement;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const px = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const py = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        const snapped = this.snapToGrid(px / this.scale(), py / this.scale());

        const x = Math.min(this.drawStart.x, snapped.x);
        const y = Math.min(this.drawStart.y, snapped.y);
        const widthM = Math.abs(snapped.x - this.drawStart.x);
        const heightM = Math.abs(snapped.y - this.drawStart.y);

        if (widthM >= 0.5 && heightM >= 0.5) {
          const mode = this.drawMode();
          const objType = mode as LayoutObjectType;
          this.objectForm = {
            type: objType,
            x,
            y,
            widthM,
            heightM,
            code: this.generateCode(objType),
            name: '',
          };
          this.objectDialogMode = 'create';
          this.showObjectDialog.set(true);
        }
      }
      this.drawStart = null;
      this.drawRect.set(null);
    }
  }

  // ─── Object management ────────────────────────────────────────────────────

  protected onAddObject(type: LayoutObjectType): void {
    const defaultSizes: Record<LayoutObjectType, { w: number; h: number }> = {
      zone: { w: 10, h: 8 },
      aisle: { w: 5, h: 4 },
      bin: { w: 2, h: 1.5 },
      label: { w: 3, h: 1 },
      corridor: { w: 8, h: 2 },
    };
    const sz = defaultSizes[type] ?? { w: 4, h: 3 };
    this.objectForm = {
      type,
      x: 0,
      y: 0,
      widthM: sz.w,
      heightM: sz.h,
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
    this.panX.set(16);
    this.panY.set(16);
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

  /**
   * Convert a MouseEvent to canvas-local coordinates in meters.
   * Returns null if the event is outside the canvas area.
   * Note: getBoundingClientRect() already reflects the canvas's absolute position
   * (panX, panY), so NO manual pan subtraction is needed.
   */
  private getCanvasPos(event: MouseEvent): { x: number; y: number } | null {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    // Return null if outside canvas bounds (allows click-outside-canvas to pan)
    if (px < 0 || py < 0 || px > rect.width || py > rect.height) return null;
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
    const prefixes: Record<LayoutObjectType, string> = {
      zone: 'Z',
      aisle: 'A',
      bin: 'B',
      label: 'L',
      corridor: 'C',
    };
    const prefix = prefixes[type] ?? 'O';
    const existing = this.objects().filter((o) => o.type === type);
    return `${prefix}-${String(existing.length + 1).padStart(3, '0')}`;
  }

  protected getObjectClass(obj: CanvasObject): string {
    const typeClass: Record<string, string> = {
      zone: 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600',
      aisle: 'bg-purple-100 dark:bg-purple-900 border-purple-400 dark:border-purple-600',
      bin: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600',
      label: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700',
      corridor: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
    };
    const base = typeClass[obj.type] ?? 'bg-surface-100 border-surface-400';
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
