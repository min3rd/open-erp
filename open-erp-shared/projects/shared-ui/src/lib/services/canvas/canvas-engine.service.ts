import { Injectable, signal, computed } from '@angular/core';
import { CanvasNode, CanvasEdge, CanvasState } from '../../models/canvas.model';

/**
 * CanvasEngineService
 * Service trung tâm quản lý trạng thái của Graph vẽ trên Canvas (nodes, edges, selection, viewport).
 * Sử dụng Angular Signals để quản lý phản ứng.
 */
@Injectable({ providedIn: 'root' })
export class CanvasEngineService {
  readonly nodes = signal<CanvasNode[]>([]);
  readonly edges = signal<CanvasEdge[]>([]);
  readonly selectedNodeIds = signal<string[]>([]);
  readonly selectedEdgeIds = signal<string[]>([]);
  readonly viewport = signal<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 1 });

  readonly selection = computed(() => ({
    nodeIds: this.selectedNodeIds(),
    edgeIds: this.selectedEdgeIds(),
  }));

  setGraph(nodes: CanvasNode[], edges: CanvasEdge[]): void {
    this.nodes.set(nodes);
    this.edges.set(edges);
    this.clearSelection();
  }

  addNode(node: CanvasNode): void {
    this.nodes.update((prev) => [...prev, node]);
  }

  updateNodePosition(nodeId: string, x: number, y: number): void {
    this.nodes.update((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, position: { x, y } } : n))
    );
  }

  updateNodeData(nodeId: string, data: Partial<CanvasNode['data']>): void {
    this.nodes.update((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    );
  }

  removeNode(nodeId: string): void {
    this.nodes.update((prev) => prev.filter((n) => n.id !== nodeId));
    // Tự động xóa các edge liên quan tới node bị xóa
    this.edges.update((prev) =>
      prev.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
    );
    this.selectedNodeIds.update((prev) => prev.filter((id) => id !== nodeId));
  }

  addEdge(edge: CanvasEdge): void {
    this.edges.update((prev) => {
      // Ngăn chặn tạo trùng lặp đường nối giữa cùng một nguồn và đích
      const exists = prev.some(
        (e) => e.sourceNodeId === edge.sourceNodeId && e.targetNodeId === edge.targetNodeId
      );
      return exists ? prev : [...prev, edge];
    });
  }

  removeEdge(edgeId: string): void {
    this.edges.update((prev) => prev.filter((e) => e.id !== edgeId));
    this.selectedEdgeIds.update((prev) => prev.filter((id) => id !== edgeId));
  }

  selectNode(nodeId: string, multi = false): void {
    if (multi) {
      this.selectedNodeIds.update((prev) =>
        prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      );
    } else {
      this.selectedNodeIds.set([nodeId]);
      this.selectedEdgeIds.set([]);
    }
  }

  selectEdge(edgeId: string, multi = false): void {
    if (multi) {
      this.selectedEdgeIds.update((prev) =>
        prev.includes(edgeId) ? prev.filter((id) => id !== edgeId) : [...prev, edgeId]
      );
    } else {
      this.selectedEdgeIds.set([edgeId]);
      this.selectedNodeIds.set([]);
    }
  }

  clearSelection(): void {
    this.selectedNodeIds.set([]);
    this.selectedEdgeIds.set([]);
  }

  setViewport(x: number, y: number, zoom: number): void {
    this.viewport.set({ x, y, zoom });
  }

  getState(): CanvasState {
    return {
      nodes: this.nodes(),
      edges: this.edges(),
      viewport: this.viewport(),
    };
  }
}
