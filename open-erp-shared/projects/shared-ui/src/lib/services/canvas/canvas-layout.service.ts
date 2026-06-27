import { Injectable } from '@angular/core';
import { CanvasNode, CanvasEdge } from '../../models/canvas.model';
import * as dagre from 'dagre';

/**
 * CanvasLayoutService
 * Cung cấp thuật toán tự động bố trí (auto-layout) sơ đồ quy trình sử dụng Dagre Graphlib.
 */
@Injectable({ providedIn: 'root' })
export class CanvasLayoutService {
  /**
   * Tính toán và bố trí lại vị trí các node theo thuật toán phân cấp.
   * Mặc định là Top-to-Bottom (từ trên xuống dưới).
   */
  autoLayout(nodes: CanvasNode[], edges: CanvasEdge[], direction: 'TB' | 'LR' = 'TB'): CanvasNode[] {
    if (nodes.length === 0) return [];

    const g = new dagre.graphlib.Graph();

    // Cấu hình graph layout
    g.setGraph({
      rankdir: direction,
      nodesep: 60,  // Khoảng cách giữa các node cùng cấp (px)
      ranksep: 80,  // Khoảng cách giữa các tầng cấp (px)
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Đăng ký nodes với Dagre
    for (const node of nodes) {
      const width = node.size?.width ?? 180;
      const height = node.size?.height ?? 80;
      g.setNode(node.id, { width, height });
    }

    // Đăng ký edges với Dagre
    for (const edge of edges) {
      g.setEdge(edge.sourceNodeId, edge.targetNodeId);
    }

    // Thực thi thuật toán sắp xếp vị trí
    dagre.layout(g);

    // Trích xuất lại tọa độ và cập nhật vào nodes danh sách mới
    return nodes.map((node) => {
      const dagreNode = g.node(node.id);
      if (dagreNode) {
        const width = node.size?.width ?? 180;
        const height = node.size?.height ?? 80;
        
        // Dagre trả về tọa độ trung tâm (center), ta chuyển về góc trên-trái (top-left)
        return {
          ...node,
          position: {
            x: Math.round(dagreNode.x - width / 2),
            y: Math.round(dagreNode.y - height / 2),
          },
        };
      }
      return node;
    });
  }
}
