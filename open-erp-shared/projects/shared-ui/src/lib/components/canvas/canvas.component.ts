import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

import { CanvasNode, CanvasEdge, CanvasOptions, CanvasState } from '../../models/canvas.model';
import { CanvasEngineService } from '../../services/canvas/canvas-engine.service';
import { CanvasLayoutService } from '../../services/canvas/canvas-layout.service';
import { CanvasHistoryService } from '../../services/canvas/canvas-history.service';

import { CanvasNodeComponent } from './canvas-node/canvas-node.component';
import { CanvasEdgeComponent } from './canvas-edge/canvas-edge.component';
import { CanvasToolbarComponent } from './canvas-toolbar/canvas-toolbar.component';

/**
 * CanvasComponent
 * Component trung tâm quản lý bản vẽ đồ họa, xử lý phóng to/thu nhỏ (zoom), dịch chuyển (pan),
 * phối hợp vẽ Nodes/Edges, kéo thả nối dây, auto-layout và lưu lịch sử hoàn tác.
 */
@Component({
  selector: 'oerp-canvas',
  standalone: true,
  imports: [
    CommonModule,
    CanvasNodeComponent,
    CanvasEdgeComponent,
    CanvasToolbarComponent,
  ],
  templateUrl: './canvas.component.html',
})
export class CanvasComponent implements AfterViewInit, OnChanges {
  @ViewChild('svgElement', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('gContainer', { static: true }) gRef!: ElementRef<SVGGElement>;

  // Inputs
  nodes = input.required<CanvasNode[]>();
  edges = input.required<CanvasEdge[]>();
  options = input<CanvasOptions>({});

  // Outputs
  nodeClicked = output<CanvasNode>();
  edgeClicked = output<CanvasEdge>();
  nodesMoved = output<CanvasNode[]>();
  edgeConnected = output<CanvasEdge>();
  selectionChanged = output<{ nodeIds: string[]; edgeIds: string[] }>();
  canvasChanged = output<CanvasState>();

  // Inject các services quản lý lõi
  readonly engine = inject(CanvasEngineService);
  readonly layoutService = inject(CanvasLayoutService);
  readonly history = inject(CanvasHistoryService);

  // States cục bộ phản ánh lên template
  readonly nodesState = this.engine.nodes;
  readonly edgesState = this.engine.edges;
  readonly selectedNodeIds = this.engine.selectedNodeIds;
  readonly selectedEdgeIds = this.engine.selectedEdgeIds;

  // Dành cho kéo thả và kết nối tạm thời
  connectingSourceNodeId = signal<string | null>(null);
  tempConnectionTarget = signal<{ x: number; y: number } | null>(null);

  // Lưới hiển thị động
  gridType = signal<'lines' | 'dots' | 'none'>('dots');

  // Quản lý kéo thả node
  private draggedNodeId: string | null = null;
  private dragStartPos = { x: 0, y: 0 };
  private nodeOriginalPos = { x: 0, y: 0 };

  // D3 zoom instance
  private svgSelect!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private gSelect!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;

  constructor() {
    // Tự động đồng bộ gridType từ options khi khởi chạy
    effect(
      () => {
        const type = this.options().gridType ?? 'dots';
        this.gridType.set(type);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] || changes['edges']) {
      this.syncGraphInputs();
    }
  }

  ngAfterViewInit(): void {
    this.svgSelect = d3.select(this.svgRef.nativeElement);
    this.gSelect = d3.select(this.gRef.nativeElement);

    const minZoom = this.options().minZoom ?? 0.2;
    const maxZoom = this.options().maxZoom ?? 3;

    // Cấu hình D3 Zoom & Pan
    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .on('zoom', (event) => {
        this.gSelect.attr('transform', event.transform.toString());
        this.engine.setViewport(event.transform.x, event.transform.y, event.transform.k);
      });

    this.svgSelect.call(this.zoomBehavior);

    // Thu phóng vừa màn hình khi khởi chạy nếu được cài đặt
    if (this.options().fitOnInit) {
      setTimeout(() => this.onZoomFit(), 120);
    }
  }

  private syncGraphInputs(): void {
    const currentNodes = this.engine.nodes();
    const currentEdges = this.engine.edges();
    const incomingNodes = this.nodes();
    const incomingEdges = this.edges();

    const isNodesEqual = JSON.stringify(currentNodes) === JSON.stringify(incomingNodes);
    const isEdgesEqual = JSON.stringify(currentEdges) === JSON.stringify(incomingEdges);

    if (!isNodesEqual || !isEdgesEqual) {
      this.engine.setGraph(incomingNodes, incomingEdges);
    }
  }

  // --- NODE & EDGE SELECTION ---

  onNodeSelect(node: CanvasNode): void {
    this.engine.selectNode(node.id, false);
    this.nodeClicked.emit(node);
    this.selectionChanged.emit(this.engine.selection());
  }

  onEdgeSelect(edge: CanvasEdge): void {
    this.engine.selectEdge(edge.id, false);
    this.edgeClicked.emit(edge);
    this.selectionChanged.emit(this.engine.selection());
  }

  onCanvasClick(event: MouseEvent): void {
    // Click vào vùng nền trống để bỏ chọn
    if (event.target === this.svgRef.nativeElement) {
      this.engine.clearSelection();
      this.selectionChanged.emit(this.engine.selection());
    }
  }

  // --- DRAGGING NODE HANDLING ---

  onNodeDragStart(data: { node: CanvasNode; event: MouseEvent }): void {
    if (this.options().readOnly) return;
    this.draggedNodeId = data.node.id;
    this.dragStartPos = { x: data.event.clientX, y: data.event.clientY };
    this.nodeOriginalPos = { ...data.node.position };

    // Lưu snapshot lịch sử trước khi bắt đầu dịch chuyển
    this.history.pushState(this.engine.getState());
  }

  onCanvasMouseMove(event: MouseEvent): void {
    const viewport = this.engine.viewport();

    // 1. Nếu đang kéo di chuyển node
    if (this.draggedNodeId) {
      const dx = (event.clientX - this.dragStartPos.x) / viewport.zoom;
      const dy = (event.clientY - this.dragStartPos.y) / viewport.zoom;

      let newX = this.nodeOriginalPos.x + dx;
      let newY = this.nodeOriginalPos.y + dy;

      // Hỗ trợ snap to grid nếu được cấu hình
      if (this.options().snapToGrid) {
        const size = this.options().snapGridSize ?? 20;
        newX = Math.round(newX / size) * size;
        newY = Math.round(newY / size) * size;
      }

      this.engine.updateNodePosition(this.draggedNodeId, newX, newY);
    }

    // 2. Nếu đang kéo dây nối tạm thời
    else if (this.connectingSourceNodeId()) {
      const rect = this.svgRef.nativeElement.getBoundingClientRect();
      const localX = (event.clientX - rect.left - viewport.x) / viewport.zoom;
      const localY = (event.clientY - rect.top - viewport.y) / viewport.zoom;
      this.tempConnectionTarget.set({ x: localX, y: localY });
    }
  }

  onCanvasMouseUp(event: MouseEvent): void {
    if (this.draggedNodeId) {
      this.draggedNodeId = null;
      this.nodesMoved.emit(this.engine.nodes());
      this.emitCanvasChange();
    }

    const sourceId = this.connectingSourceNodeId();
    if (sourceId) {
      // Dịch chuyển tọa độ client của sự kiện mouseup về hệ tọa độ local SVG
      const rect = this.svgRef.nativeElement.getBoundingClientRect();
      const viewport = this.engine.viewport();
      const localX = (event.clientX - rect.left - viewport.x) / viewport.zoom;
      const localY = (event.clientY - rect.top - viewport.y) / viewport.zoom;

      // Thực hiện kiểm tra va chạm (Hit Testing) để tìm node nhận thả dây
      const targetNode = this.engine.nodes().find((node) => {
        if (node.id === sourceId) return false;
        const w = this.getNodeWidth(node);
        const h = 80;
        return (
          localX >= node.position.x &&
          localX <= node.position.x + w &&
          localY >= node.position.y &&
          localY <= node.position.y + h
        );
      });

      if (targetNode) {
        // Lưu trạng thái trước khi kết nối dây
        this.history.pushState(this.engine.getState());

        const newEdge: CanvasEdge = {
          id: `edge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sourceNodeId: sourceId,
          targetNodeId: targetNode.id,
          type: this.options().defaultEdgeType ?? 'bezier',
          data: { label: '' },
        };

        this.engine.addEdge(newEdge);
        this.edgeConnected.emit(newEdge);
        this.emitCanvasChange();
      }

      this.connectingSourceNodeId.set(null);
    }
  }

  // --- CONNECTING NODE HANDLING (CREATING EDGES) ---

  onConnectStart(data: { nodeId: string; event: MouseEvent }): void {
    if (this.options().readOnly) return;
    this.connectingSourceNodeId.set(data.nodeId);

    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const viewport = this.engine.viewport();
    const localX = (data.event.clientX - rect.left - viewport.x) / viewport.zoom;
    const localY = (data.event.clientY - rect.top - viewport.y) / viewport.zoom;

    this.tempConnectionTarget.set({ x: localX, y: localY });
  }

  // Lệnh SVG vẽ dây nối tạm thời
  tempConnectionPathD = computed(() => {
    const sId = this.connectingSourceNodeId();
    const target = this.tempConnectionTarget();
    if (!sId || !target) return '';

    const sNode = this.getNodeById(sId);
    if (!sNode) return '';

    const sWidth = this.getNodeWidth(sNode);
    const sx = sNode.position.x + sWidth;
    const sy = sNode.position.y + 40;

    const tx = target.x;
    const ty = target.y;

    const dx = Math.abs(tx - sx);
    const cx1 = sx + dx / 2;
    const cx2 = tx - dx / 2;
    return `M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ty}, ${tx} ${ty}`;
  });

  // --- TOOLBAR OUTLETS & BUTTONS ---

  onZoomIn(): void {
    this.zoomBehavior.scaleBy(this.svgSelect.transition().duration(200), 1.25);
  }

  onZoomOut(): void {
    this.zoomBehavior.scaleBy(this.svgSelect.transition().duration(200), 1 / 1.25);
  }

  onZoomFit(): void {
    const nodesList = this.engine.nodes();
    if (nodesList.length === 0) return;

    // Tìm vùng chứa tất cả các node
    const xs = nodesList.map((n) => n.position.x);
    const ys = nodesList.map((n) => n.position.y);

    const minX = Math.min(...xs) - 40;
    const maxX = Math.max(...xs) + 200;
    const minY = Math.min(...ys) - 40;
    const maxY = Math.max(...ys) + 120;

    const gWidth = maxX - minX;
    const gHeight = maxY - minY;

    const svgWidth = this.svgRef.nativeElement.clientWidth || 800;
    const svgHeight = this.svgRef.nativeElement.clientHeight || 500;

    // Tính toán tỉ lệ zoom tối ưu
    const scale = Math.min(svgWidth / gWidth, svgHeight / gHeight, 1.5) * 0.95;

    const transform = d3.zoomIdentity
      .translate(
        (svgWidth - gWidth * scale) / 2 - minX * scale,
        (svgHeight - gHeight * scale) / 2 - minY * scale
      )
      .scale(scale);

    this.svgSelect.transition().duration(400).call(this.zoomBehavior.transform, transform);
  }

  onToggleGrid(): void {
    const current = this.gridType();
    const next = current === 'lines' ? 'dots' : current === 'dots' ? 'none' : 'lines';
    this.gridType.set(next);
  }

  onAutoLayout(): void {
    this.history.pushState(this.engine.getState());
    const layouted = this.layoutService.autoLayout(this.engine.nodes(), this.engine.edges());
    this.engine.nodes.set(layouted);
    this.onZoomFit();
    this.emitCanvasChange();
  }

  onUndo(): void {
    const res = this.history.undo(this.engine.getState());
    if (res.success && res.state) {
      this.engine.setGraph(res.state.nodes, res.state.edges);
      this.emitCanvasChange();
    }
  }

  onRedo(): void {
    const res = this.history.redo(this.engine.getState());
    if (res.success && res.state) {
      this.engine.setGraph(res.state.nodes, res.state.edges);
      this.emitCanvasChange();
    }
  }

  // --- KEYBOARD ACCESSIBILITY COMPLIANCE ---

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.options().readOnly) return;

    const isCtrl = event.ctrlKey || event.metaKey;

    // Phím DELETE: Xóa các phần tử đang được chọn
    if (event.key === 'Delete') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return; // Đang gõ chữ thì không xóa
      }

      const sNodes = this.engine.selectedNodeIds();
      const sEdges = this.engine.selectedEdgeIds();

      if (sNodes.length > 0 || sEdges.length > 0) {
        this.history.pushState(this.engine.getState());
        sNodes.forEach((id) => this.engine.removeNode(id));
        sEdges.forEach((id) => this.engine.removeEdge(id));
        this.emitCanvasChange();
      }
    }

    // Ctrl+Z: Undo
    if (isCtrl && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.onUndo();
    }

    // Ctrl+Y: Redo
    if (isCtrl && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.onRedo();
    }

    // Ctrl+A: Chọn tất cả Nodes
    if (isCtrl && event.key.toLowerCase() === 'a') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      event.preventDefault();
      const allIds = this.engine.nodes().map((n) => n.id);
      this.engine.selectedNodeIds.set(allIds);
      this.engine.selectedEdgeIds.set([]);
      this.selectionChanged.emit(this.engine.selection());
    }
  }

  // --- HELPER METHODS ---

  getNodeById(id: string): CanvasNode | undefined {
    return this.engine.nodes().find((n) => n.id === id);
  }

  private getNodeWidth(node: CanvasNode): number {
    const type = node.type;
    if (type === 'start' || type === 'end' || type === 'gateway') return 80;
    if (type === 'fork') return 120;
    return 180;
  }

  private emitCanvasChange(): void {
    this.canvasChanged.emit(this.engine.getState());
  }
}
