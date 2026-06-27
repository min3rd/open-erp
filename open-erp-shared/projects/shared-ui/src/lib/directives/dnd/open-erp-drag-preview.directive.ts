import { Directive } from '@angular/core';
import { CdkDragPreview } from '@angular/cdk/drag-drop';

/**
 * OpenErpDragPreviewDirective
 * Đánh dấu template tùy chỉnh để làm hình ảnh hiển thị (ghost) khi đang kéo.
 */
@Directive({
  selector: '[open-erp-drag-preview]',
  standalone: true,
  hostDirectives: [CdkDragPreview],
})
export class OpenErpDragPreviewDirective {}
