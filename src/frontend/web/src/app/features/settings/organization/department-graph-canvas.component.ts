import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared';

export interface CanvasGraphNode {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  depth: number;
  x: number;
  y: number;
  hasChildren: boolean;
  collapsed: boolean;
  memberCount: number;
}

export interface CanvasGraphEdge {
  id: string;
  parentId: string;
  childId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type GraphCursor = 'grab' | 'grabbing' | 'pointer';

interface ViewportState {
  zoom: number;
  cx: number;
  cy: number;
}

interface Palette {
  background: string;
  nodeFill: string;
  nodeFillSelected: string;
  nodeBorder: string;
  nodeBorderHover: string;
  nodeBorderSelected: string;
  nodeText: string;
  nodeMuted: string;
  edge: string;
  edgeActive: string;
  badgeBorder: string;
  badgeText: string;
  collapseFill: string;
  collapseFillHover: string;
  collapseBorder: string;
  collapseText: string;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 1.2;
const WHEEL_SENSITIVITY = 0.0015;
const VIEWPORT_STORAGE_KEY = 'openerp_org_graph_viewport';
const FIT_PADDING = 32;
const COLLAPSE_SIZE = 16;
const CLICK_TOLERANCE = 4;
const FONT_NAME = '500 11px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const FONT_CODE = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const FONT_BADGE = '9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const FONT_CONTROL = '600 10px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

const LIGHT_PALETTE: Palette = {
  background: '#fafafa',
  nodeFill: '#ffffff',
  nodeFillSelected: '#f5f5f5',
  nodeBorder: '#d4d4d4',
  nodeBorderHover: '#a3a3a3',
  nodeBorderSelected: '#171717',
  nodeText: '#171717',
  nodeMuted: '#a3a3a3',
  edge: '#d4d4d4',
  edgeActive: '#737373',
  badgeBorder: '#e5e5e5',
  badgeText: '#737373',
  collapseFill: '#ffffff',
  collapseFillHover: '#f5f5f5',
  collapseBorder: '#a3a3a3',
  collapseText: '#525252'
};

const DARK_PALETTE: Palette = {
  background: '#0a0a0a',
  nodeFill: '#171717',
  nodeFillSelected: '#262626',
  nodeBorder: '#404040',
  nodeBorderHover: '#737373',
  nodeBorderSelected: '#f5f5f5',
  nodeText: '#f5f5f5',
  nodeMuted: '#737373',
  edge: '#404040',
  edgeActive: '#a3a3a3',
  badgeBorder: '#404040',
  badgeText: '#a3a3a3',
  collapseFill: '#171717',
  collapseFillHover: '#262626',
  collapseBorder: '#525252',
  collapseText: '#d4d4d4'
};

@Component({
  selector: 'app-department-graph-canvas',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './department-graph-canvas.component.html'
})
export class DepartmentGraphCanvasComponent implements AfterViewInit, OnDestroy {
  readonly nodes = input<CanvasGraphNode[]>([]);
  readonly edges = input<CanvasGraphEdge[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly nodeWidth = input<number>(152);
  readonly nodeHeight = input<number>(56);

  readonly nodeSelected = output<string>();
  readonly collapseToggled = output<string>();

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('graphCanvas');
  private readonly viewportRef = viewChild<ElementRef<HTMLDivElement>>('graphViewport');

  readonly zoom = signal<number>(1);
  readonly zoomPercent = computed<string>(() => `${Math.round(this.zoom() * 100)}%`);
  readonly cursorPosition = signal<{ x: number; y: number } | null>(null);
  readonly hasNodes = computed<boolean>(() => this.nodes().length > 0);

  private readonly hoverNodeId = signal<string | null>(null);
  private readonly collapseHovered = signal<boolean>(false);
  private readonly panning = signal<boolean>(false);
  readonly cursor = computed<GraphCursor>(() => {
    if (this.panning()) {
      return 'grabbing';
    }
    return this.hoverNodeId() ? 'pointer' : 'grab';
  });

  private panX = 0;
  private panY = 0;
  private dpr = 1;
  private cssWidth = 0;
  private cssHeight = 0;
  private drawQueued = false;
  private initialized = false;
  private spaceHeld = false;
  private pointerId: number | null = null;
  private panStart: { clientX: number; clientY: number; panX: number; panY: number; moved: boolean } | null = null;
  private pressedNode: { node: CanvasGraphNode; onCollapse: boolean } | null = null;
  private pendingViewport: ViewportState | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly textCache = new Map<string, { source: string; result: string }>();

  private readonly onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.hasNodes()) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * WHEEL_SENSITIVITY);
    this.zoomAt(event.clientX - rect.left, event.clientY - rect.top, factor);
  };

  private readonly onWindowKeyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || event.repeat) {
      return;
    }
    this.spaceHeld = true;
    const viewport = this.viewportRef()?.nativeElement;
    const target = event.target as Node | null;
    if (viewport && target && (target === viewport || viewport.contains(target))) {
      event.preventDefault();
    }
  };

  private readonly onWindowKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      this.spaceHeld = false;
    }
  };

  private readonly onWindowBlur = () => {
    this.spaceHeld = false;
  };

  constructor() {
    this.pendingViewport = this.readStoredViewport();
    effect(() => {
      const nodes = this.nodes();
      this.edges();
      this.selectedId();
      this.nodeWidth();
      this.nodeHeight();
      this.zoom();
      this.hoverNodeId();
      this.collapseHovered();
      if (!nodes.length) {
        this.initialized = false;
      }
      this.scheduleDraw();
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef()?.nativeElement;
    const viewport = this.viewportRef()?.nativeElement;
    if (!canvas || !viewport) {
      return;
    }
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onWindowKeyDown);
    window.addEventListener('keyup', this.onWindowKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(viewport);
    this.themeObserver = new MutationObserver(() => this.scheduleDraw());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    this.resizeCanvas();
  }

  ngOnDestroy() {
    const canvas = this.canvasRef()?.nativeElement;
    canvas?.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onWindowKeyDown);
    window.removeEventListener('keyup', this.onWindowKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
  }

  zoomIn() {
    this.zoomAt(this.cssWidth / 2, this.cssHeight / 2, ZOOM_STEP);
  }

  zoomOut() {
    this.zoomAt(this.cssWidth / 2, this.cssHeight / 2, 1 / ZOOM_STEP);
  }

  resetZoom() {
    if (this.zoom() !== 1) {
      this.zoomAt(this.cssWidth / 2, this.cssHeight / 2, 1 / this.zoom());
    }
  }

  fitView() {
    if (!this.fitToContent()) {
      return;
    }
    this.persistViewport();
    this.scheduleDraw();
  }

  onPointerDown(event: PointerEvent) {
    const canvas = this.canvasRef()?.nativeElement;
    const viewport = this.viewportRef()?.nativeElement;
    if (!canvas || !viewport || !this.hasNodes()) {
      return;
    }
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) {
      return;
    }
    viewport.focus();
    event.preventDefault();
    if (!canvas.hasPointerCapture(event.pointerId)) {
      canvas.setPointerCapture(event.pointerId);
    }
    this.pointerId = event.pointerId;
    const world = this.toWorld(event.offsetX, event.offsetY);
    const canHit = !this.spaceHeld && event.button !== 1;
    const hit = canHit ? this.hitTest(world.x, world.y) : null;
    if (hit) {
      this.pressedNode = hit;
      return;
    }
    this.panStart = {
      clientX: event.clientX,
      clientY: event.clientY,
      panX: this.panX,
      panY: this.panY,
      moved: false
    };
    this.panning.set(true);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.hasNodes()) {
      return;
    }
    const world = this.toWorld(event.offsetX, event.offsetY);
    this.cursorPosition.set({ x: Math.round(world.x), y: Math.round(world.y) });

    if (this.pointerId === event.pointerId && this.panStart) {
      const dx = event.clientX - this.panStart.clientX;
      const dy = event.clientY - this.panStart.clientY;
      if (Math.abs(dx) > CLICK_TOLERANCE || Math.abs(dy) > CLICK_TOLERANCE) {
        this.panStart.moved = true;
      }
      if (this.panStart.moved) {
        this.panX = this.panStart.panX + dx;
        this.panY = this.panStart.panY + dy;
        this.scheduleDraw();
      }
      return;
    }

    const hit = this.hitTest(world.x, world.y);
    const nextHover = hit?.node.id ?? null;
    const nextCollapse = hit?.onCollapse ?? false;
    if (nextHover !== this.hoverNodeId() || nextCollapse !== this.collapseHovered()) {
      this.hoverNodeId.set(nextHover);
      this.collapseHovered.set(nextCollapse);
    }
  }

  onPointerUp(event: PointerEvent) {
    if (this.pointerId !== event.pointerId) {
      return;
    }
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    this.pointerId = null;
    const pressed = this.pressedNode;
    const pan = this.panStart;
    this.pressedNode = null;
    this.panStart = null;
    this.panning.set(false);

    if (pressed) {
      if (pressed.onCollapse) {
        this.collapseToggled.emit(pressed.node.id);
      } else {
        this.nodeSelected.emit(pressed.node.id);
      }
      return;
    }
    if (pan?.moved) {
      this.persistViewport();
    }
  }

  onPointerLeave() {
    if (!this.pointerId) {
      this.cursorPosition.set(null);
      if (this.hoverNodeId() || this.collapseHovered()) {
        this.hoverNodeId.set(null);
        this.collapseHovered.set(false);
      }
    }
  }

  onDoubleClick(event: MouseEvent) {
    if (!this.hasNodes()) {
      return;
    }
    const world = this.toWorld(event.offsetX, event.offsetY);
    const hit = this.hitTest(world.x, world.y);
    if (!hit) {
      return;
    }
    const node = hit.node;
    this.centerOn(
      node.x + this.nodeWidth() / 2,
      node.y + this.nodeHeight() / 2,
      Math.max(this.zoom(), 1)
    );
  }

  onKeydown(event: KeyboardEvent) {
    const step = 56;
    let handled = true;
    switch (event.key) {
      case 'ArrowLeft':
        this.panBy(step, 0);
        break;
      case 'ArrowRight':
        this.panBy(-step, 0);
        break;
      case 'ArrowUp':
        this.panBy(0, step);
        break;
      case 'ArrowDown':
        this.panBy(0, -step);
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
      case '_':
        this.zoomOut();
        break;
      case '0':
        this.resetZoom();
        break;
      case 'f':
      case 'F':
        this.fitView();
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
    }
  }

  private panBy(dx: number, dy: number) {
    this.panX += dx;
    this.panY += dy;
    this.persistViewport();
    this.scheduleDraw();
  }

  private zoomAt(screenX: number, screenY: number, factor: number) {
    const current = this.zoom();
    const next = clamp(current * factor, ZOOM_MIN, ZOOM_MAX);
    if (Math.abs(next - current) < 0.0001) {
      return;
    }
    const worldX = (screenX - this.panX) / current;
    const worldY = (screenY - this.panY) / current;
    const rounded = round2(next);
    this.zoom.set(rounded);
    this.panX = screenX - worldX * rounded;
    this.panY = screenY - worldY * rounded;
    this.persistViewport();
    this.scheduleDraw();
  }

  private centerOn(worldX: number, worldY: number, zoom: number) {
    const next = round2(clamp(zoom, ZOOM_MIN, ZOOM_MAX));
    this.zoom.set(next);
    this.panX = this.cssWidth / 2 - worldX * next;
    this.panY = this.cssHeight / 2 - worldY * next;
    this.persistViewport();
    this.scheduleDraw();
  }

  private fitToContent(): boolean {
    const nodes = this.nodes();
    if (!nodes.length || !this.cssWidth || !this.cssHeight) {
      return false;
    }
    const nw = this.nodeWidth();
    const nh = this.nodeHeight();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + nw);
      maxY = Math.max(maxY, node.y + nh);
    }
    const boundsWidth = Math.max(1, maxX - minX);
    const boundsHeight = Math.max(1, maxY - minY);
    const zoom = round2(
      clamp(
        Math.min(
          (this.cssWidth - FIT_PADDING * 2) / boundsWidth,
          (this.cssHeight - FIT_PADDING * 2) / boundsHeight
        ),
        ZOOM_MIN,
        ZOOM_MAX
      )
    );
    this.zoom.set(zoom);
    this.panX = this.cssWidth / 2 - ((minX + maxX) / 2) * zoom;
    this.panY = this.cssHeight / 2 - ((minY + maxY) / 2) * zoom;
    return true;
  }

  private resizeCanvas() {
    const viewport = this.viewportRef()?.nativeElement;
    const canvas = this.canvasRef()?.nativeElement;
    if (!viewport || !canvas) {
      return;
    }
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    this.cssWidth = width;
    this.cssHeight = height;
    this.dpr = dpr;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    this.ensureInitialized();
    this.scheduleDraw();
  }

  private ensureInitialized() {
    if (this.initialized || !this.cssWidth || !this.cssHeight || !this.nodes().length) {
      return;
    }
    this.initialized = true;
    if (this.pendingViewport) {
      const restored = this.pendingViewport;
      this.pendingViewport = null;
      this.centerOn(restored.cx, restored.cy, restored.zoom);
      return;
    }
    if (this.fitToContent()) {
      this.persistViewport();
    }
  }

  private scheduleDraw() {
    if (this.drawQueued) {
      return;
    }
    this.drawQueued = true;
    requestAnimationFrame(() => {
      this.drawQueued = false;
      this.draw();
    });
  }

  private draw() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.cssWidth || !this.cssHeight) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    this.ensureInitialized();
    const dark = document.documentElement.classList.contains('dark');
    const palette = dark ? DARK_PALETTE : LIGHT_PALETTE;
    const zoom = this.zoom();

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    ctx.translate(this.panX, this.panY);
    ctx.scale(zoom, zoom);

    const viewLeft = -this.panX / zoom;
    const viewTop = -this.panY / zoom;
    const viewRight = (this.cssWidth - this.panX) / zoom;
    const viewBottom = (this.cssHeight - this.panY) / zoom;

    const selected = this.selectedId();
    const nw = this.nodeWidth();
    const nh = this.nodeHeight();
    const lineWidth = Math.max(0.75 / zoom, 0.35);
    ctx.lineWidth = lineWidth;

    for (const edge of this.edges()) {
      const minX = Math.min(edge.x1, edge.x2);
      const maxX = Math.max(edge.x1, edge.x2);
      const minY = Math.min(edge.y1, edge.y2);
      const maxY = Math.max(edge.y1, edge.y2);
      if (maxX < viewLeft || minX > viewRight || maxY < viewTop || minY > viewBottom) {
        continue;
      }
      ctx.strokeStyle =
        selected && (edge.parentId === selected || edge.childId === selected)
          ? palette.edgeActive
          : palette.edge;
      this.strokeElbow(ctx, edge.x1, edge.y1, edge.x2, edge.y2);
    }

    const hoverNodeId = this.hoverNodeId();
    const collapseHovered = this.collapseHovered();
    for (const node of this.nodes()) {
      if (node.x > viewRight || node.x + nw < viewLeft || node.y > viewBottom || node.y + nh < viewTop) {
        continue;
      }
      this.drawNode(ctx, node, palette, zoom, {
        selected: node.id === selected,
        hovered: node.id === hoverNodeId,
        collapseHovered: node.id === hoverNodeId && collapseHovered
      });
    }
  }

  private drawNode(
    ctx: CanvasRenderingContext2D,
    node: CanvasGraphNode,
    palette: Palette,
    zoom: number,
    state: { selected: boolean; hovered: boolean; collapseHovered: boolean }
  ) {
    const nw = this.nodeWidth();
    const nh = this.nodeHeight();
    const pad = 6;
    this.roundedRect(ctx, node.x, node.y, nw, nh, 2);
    ctx.fillStyle = state.selected ? palette.nodeFillSelected : palette.nodeFill;
    ctx.fill();
    ctx.lineWidth = Math.max(0.75 / zoom, 0.4);
    ctx.strokeStyle = state.selected
      ? palette.nodeBorderSelected
      : state.hovered
        ? palette.nodeBorderHover
        : palette.nodeBorder;
    ctx.stroke();

    const controlInset = node.hasChildren ? COLLAPSE_SIZE + 4 : 0;
    ctx.textAlign = 'left';
    ctx.font = FONT_CODE;
    ctx.fillStyle = palette.nodeMuted;
    ctx.fillText(
      this.fitText(ctx, node.code, nw - pad * 2 - controlInset, `c:${node.id}`),
      node.x + pad,
      node.y + 14
    );

    ctx.font = FONT_NAME;
    ctx.fillStyle = palette.nodeText;
    ctx.fillText(
      this.fitText(ctx, node.name, nw - pad * 2 - controlInset, `n:${node.id}`),
      node.x + pad,
      node.y + 28
    );

    ctx.font = FONT_BADGE;
    const badgeText = String(node.memberCount);
    const badgeWidth = Math.max(14, ctx.measureText(badgeText).width + 10);
    const badgeY = node.y + nh - 17;
    this.roundedRect(ctx, node.x + pad, badgeY, badgeWidth, 12, 1);
    ctx.strokeStyle = palette.badgeBorder;
    ctx.stroke();
    ctx.fillStyle = palette.badgeText;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, node.x + pad + badgeWidth / 2, badgeY + 9);
    ctx.textAlign = 'left';

    if (node.hasChildren) {
      const controlX = node.x + nw - COLLAPSE_SIZE - 4;
      const controlY = node.y + 4;
      this.roundedRect(ctx, controlX, controlY, COLLAPSE_SIZE, COLLAPSE_SIZE, 1);
      ctx.fillStyle = state.collapseHovered ? palette.collapseFillHover : palette.collapseFill;
      ctx.fill();
      ctx.strokeStyle = palette.collapseBorder;
      ctx.stroke();
      ctx.fillStyle = palette.collapseText;
      ctx.font = FONT_CONTROL;
      ctx.textAlign = 'center';
      ctx.fillText(node.collapsed ? '+' : '−', controlX + COLLAPSE_SIZE / 2, controlY + 11);
      ctx.textAlign = 'left';
    }
  }

  private strokeElbow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    if (Math.abs(x2 - x1) < 0.5) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return;
    }
    const midY = y1 + (y2 - y1) / 2;
    const direction = x2 > x1 ? 1 : -1;
    const radius = Math.min(8, Math.abs(x2 - x1) / 2, Math.abs(midY - y1), Math.abs(y2 - midY));
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, midY - radius);
    ctx.quadraticCurveTo(x1, midY, x1 + direction * radius, midY);
    ctx.lineTo(x2 - direction * radius, midY);
    ctx.quadraticCurveTo(x2, midY, x2, midY + radius);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  private roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private fitText(ctx: CanvasRenderingContext2D, source: string, maxWidth: number, cacheKey: string): string {
    const cached = this.textCache.get(cacheKey);
    if (cached && cached.source === source) {
      return cached.result;
    }
    let result = source;
    if (ctx.measureText(source).width > maxWidth) {
      let cut = source;
      while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
        cut = cut.slice(0, -1);
      }
      result = `${cut}…`;
    }
    this.textCache.set(cacheKey, { source, result });
    return result;
  }

  private hitTest(worldX: number, worldY: number): { node: CanvasGraphNode; onCollapse: boolean } | null {
    const nw = this.nodeWidth();
    const nh = this.nodeHeight();
    const nodes = this.nodes();
    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const node = nodes[index];
      if (worldX < node.x || worldX > node.x + nw || worldY < node.y || worldY > node.y + nh) {
        continue;
      }
      const onCollapse =
        node.hasChildren &&
        worldX >= node.x + nw - COLLAPSE_SIZE - 6 &&
        worldX <= node.x + nw - 2 &&
        worldY >= node.y + 2 &&
        worldY <= node.y + COLLAPSE_SIZE + 6;
      return { node, onCollapse };
    }
    return null;
  }

  private toWorld(screenX: number, screenY: number): { x: number; y: number } {
    const zoom = this.zoom();
    return {
      x: (screenX - this.panX) / zoom,
      y: (screenY - this.panY) / zoom
    };
  }

  private persistViewport() {
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      if (!this.cssWidth || !this.cssHeight) {
        return;
      }
      const zoom = this.zoom();
      const state: ViewportState = {
        zoom,
        cx: (this.cssWidth / 2 - this.panX) / zoom,
        cy: (this.cssHeight / 2 - this.panY) / zoom
      };
      try {
        localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(state));
      } catch {
        return;
      }
    }, 250);
  }

  private readStoredViewport(): ViewportState | null {
    try {
      const raw = localStorage.getItem(VIEWPORT_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<ViewportState>;
      if (
        typeof parsed.zoom !== 'number' ||
        typeof parsed.cx !== 'number' ||
        typeof parsed.cy !== 'number' ||
        !Number.isFinite(parsed.zoom) ||
        !Number.isFinite(parsed.cx) ||
        !Number.isFinite(parsed.cy)
      ) {
        return null;
      }
      return { zoom: clamp(parsed.zoom, ZOOM_MIN, ZOOM_MAX), cx: parsed.cx, cy: parsed.cy };
    } catch {
      return null;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
