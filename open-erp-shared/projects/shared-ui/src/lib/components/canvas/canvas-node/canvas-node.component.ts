import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasNode } from '../../../models/canvas.model';

/**
 * CanvasNodeComponent
 * Đóng gói việc vẽ một node đơn lẻ trên Canvas bằng SVG.
 * Hỗ trợ nhiều loại hình dáng hình học khác nhau.
 */
@Component({
  selector: '[oerp-canvas-node]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-node.component.html',
})
export class CanvasNodeComponent {
  node = input.required<CanvasNode>();
  readOnly = input<boolean>(false);
  isSelected = input<boolean>(false);

  nodeClicked = output<CanvasNode>();
  nodeDragStart = output<{ node: CanvasNode; event: MouseEvent }>();
  connectStart = output<{ nodeId: string; event: MouseEvent }>();

  // Chiều rộng và chiều cao được tính dựa trên loại node
  width = computed(() => {
    const type = this.node().type;
    if (type === 'start' || type === 'end' || type === 'gateway') return 80;
    if (type === 'fork') return 120;
    return 180; // step, subprocess, custom
  });

  height = computed(() => {
    return 80; // Chiều cao chuẩn
  });

  onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    
    // Nếu click chuột trái
    if (event.button === 0) {
      this.nodeClicked.emit(this.node());
      
      if (!this.readOnly() && !this.node().locked) {
        this.nodeDragStart.emit({
          node: this.node(),
          event,
        });
      }
    }
  }

  onConnectStart(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.readOnly()) {
      this.connectStart.emit({
        nodeId: this.node().id,
        event,
      });
    }
  }
}
