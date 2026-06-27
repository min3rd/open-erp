import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasEdge, CanvasNode } from '../../../models/canvas.model';

/**
 * CanvasEdgeComponent
 * Thực hiện tính toán hình học đường đi và vẽ đường nối (Edge) giữa 2 Node.
 * Hỗ trợ 3 kiểu dáng: straight, orthogonal (gấp khúc) và bezier (cong).
 */
@Component({
  selector: '[oerp-canvas-edge]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-edge.component.html',
})
export class CanvasEdgeComponent {
  edge = input.required<CanvasEdge>();
  sourceNode = input.required<CanvasNode>();
  targetNode = input.required<CanvasNode>();
  isSelected = input<boolean>(false);
  readOnly = input<boolean>(false);

  edgeClicked = output<CanvasEdge>();

  // Chiều rộng nhãn chữ nhật tương ứng với chiều dài text
  rectWidth = computed(() => {
    const text = this.edge().data?.label || this.edge().data?.condition || '';
    return Math.max(text.length * 6 + 12, 40);
  });

  // Tìm cổng xuất phát và cổng đích dựa trên vị trí tương đối
  ports = computed(() => {
    const sNode = this.sourceNode();
    const tNode = this.targetNode();

    const sWidth = this.getNodeWidth(sNode);
    const tWidth = this.getNodeWidth(tNode);
    const sHeight = 80;
    const tHeight = 80;

    const sX = sNode.position.x;
    const sY = sNode.position.y;
    const tX = tNode.position.x;
    const tY = tNode.position.y;

    // Phán đoán hướng đi chính (dọc hay ngang)
    const isVertical = Math.abs(tY - sY) > Math.abs(tX - sX);

    let sx, sy, tx, ty;
    if (isVertical) {
      // Dọc: Nối từ đáy Source tới đỉnh Target
      sx = sX + sWidth / 2;
      sy = sY + sHeight;
      tx = tX + tWidth / 2;
      ty = tY;
    } else {
      // Ngang
      if (sX < tX) {
        // Nối từ sườn phải Source sang sườn trái Target
        sx = sX + sWidth;
        sy = sY + sHeight / 2;
        tx = tX;
        ty = tY + tHeight / 2;
      } else {
        // Nối ngược từ sườn trái Source sang sườn phải Target
        sx = sX;
        sy = sY + sHeight / 2;
        tx = tX + tWidth;
        ty = tY + tHeight / 2;
      }
    }

    return { sx, sy, tx, ty, isVertical };
  });

  // Tính toán chuỗi lệnh SVG Path (d)
  pathD = computed(() => {
    const { sx, sy, tx, ty, isVertical } = this.ports();
    const type = this.edge().type || 'bezier';

    if (type === 'straight') {
      return `M ${sx} ${sy} L ${tx} ${ty}`;
    }

    if (type === 'orthogonal') {
      if (isVertical) {
        const midY = sy + (ty - sy) / 2;
        return `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
      } else {
        const midX = sx + (tx - sx) / 2;
        return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
      }
    }

    // Bezier
    const dx = Math.abs(tx - sx);
    const dy = Math.abs(ty - sy);
    if (isVertical) {
      const cy1 = sy + dy / 2;
      const cy2 = ty - dy / 2;
      return `M ${sx} ${sy} C ${sx} ${cy1}, ${tx} ${cy2}, ${tx} ${ty}`;
    } else {
      const cx1 = sx + dx / 2;
      const cx2 = tx - dx / 2;
      return `M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ty}, ${tx} ${ty}`;
    }
  });

  // Tìm điểm chính giữa của đường nối để đặt nhãn điều kiện
  midPoint = computed(() => {
    const { sx, sy, tx, ty } = this.ports();
    return {
      x: (sx + tx) / 2,
      y: (sy + ty) / 2,
    };
  });

  onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    if (event.button === 0) {
      this.edgeClicked.emit(this.edge());
    }
  }

  private getNodeWidth(node: CanvasNode): number {
    const type = node.type;
    if (type === 'start' || type === 'end' || type === 'gateway') return 80;
    if (type === 'fork') return 120;
    return 180;
  }
}
