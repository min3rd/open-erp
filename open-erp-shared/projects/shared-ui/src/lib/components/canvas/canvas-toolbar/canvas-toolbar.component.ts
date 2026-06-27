import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CanvasToolbarComponent
 * Cung cấp thanh công cụ nổi để thực hiện các thao tác: Thu/Phóng, Căn vừa màn hình,
 * Tự động sắp xếp sơ đồ, Hoàn tác/Làm lại và Ẩn/Hiện lưới.
 */
@Component({
  selector: 'oerp-canvas-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-toolbar.component.html',
})
export class CanvasToolbarComponent {
  canUndo = input<boolean>(false);
  canRedo = input<boolean>(false);

  zoomIn = output<void>();
  zoomOut = output<void>();
  zoomFit = output<void>();
  toggleGrid = output<void>();
  layout = output<void>();
  undo = output<void>();
  redo = output<void>();
}
