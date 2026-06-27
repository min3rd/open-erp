import { Component, input, output, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndItem, DropEvent } from '../../../models/dnd.model';
import { OpenErpDropZoneDirective } from '../../../directives/dnd/open-erp-drop-zone.directive';
import { OpenErpDraggableDirective } from '../../../directives/dnd/open-erp-draggable.directive';

export interface CanvasItem<T = unknown> extends DndItem<T> {
  x: number;
  y: number;
}

/**
 * oerp-drop-canvas
 * Vùng canvas tự do (Free-form Drop Target).
 * Nhận các phần tử kéo từ ngoài vào ở tọa độ bất kỳ, hoặc di chuyển phần tử trong canvas.
 */
@Component({
  selector: 'oerp-drop-canvas',
  standalone: true,
  imports: [CommonModule, OpenErpDropZoneDirective, OpenErpDraggableDirective],
  templateUrl: './drop-canvas.component.html',
})
export class DropCanvasComponent {
  id = input<string>('drop-canvas');
  items = input.required<CanvasItem[]>();
  canvasClass = input<string>(
    'w-full h-[500px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:bg-slate-800 rounded-xl relative'
  );
  itemClass = input<string>('');

  itemDropped = output<DropEvent>();
  itemMoved = output<{ item: CanvasItem; x: number; y: number }>();

  @ContentChild(TemplateRef) itemTemplate?: TemplateRef<any>;

  onDropped(event: DropEvent): void {
    if (event.sourceZoneId !== event.targetZoneId && event.dropPosition) {
      const canvasEl = document.getElementById(this.id());
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const relativeX = event.dropPosition.x - rect.left;
        const relativeY = event.dropPosition.y - rect.top;

        event.dropPosition = {
          x: Math.max(0, Math.round(relativeX)),
          y: Math.max(0, Math.round(relativeY)),
        };
      }
      this.itemDropped.emit(event);
    }
  }

  onDragEnded(item: CanvasItem, dragEvent: { item: DndItem; event: any }): void {
    const element = dragEvent.event.source.element.nativeElement as HTMLElement;
    const parent = element.offsetParent as HTMLElement;

    if (parent) {
      const rect = parent.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      const relativeX = elemRect.left - rect.left;
      const relativeY = elemRect.top - rect.top;

      // Khôi phục transform của CDK về 0 để vị trí absolute mới chiếm quyền điều khiển
      dragEvent.event.source.reset();

      this.itemMoved.emit({
        item,
        x: Math.max(0, Math.round(relativeX)),
        y: Math.max(0, Math.round(relativeY)),
      });
    }
  }
}
