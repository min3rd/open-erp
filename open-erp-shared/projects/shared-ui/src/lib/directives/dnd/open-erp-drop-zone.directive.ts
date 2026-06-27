import { Directive, input, output, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DndItem, DropEvent } from '../../models/dnd.model';
import { DndRegistryService } from '../../services/dnd/dnd-registry.service';
import { DndStateService } from '../../services/dnd/dnd-state.service';

/**
 * OpenErpDropZoneDirective
 * Đánh dấu khu vực nhận thả phần tử. Bọc quanh CdkDropList của Angular CDK.
 */
@Directive({
  selector: '[open-erp-drop-zone]',
  standalone: true,
})
export class OpenErpDropZoneDirective implements OnInit, OnDestroy {
  private readonly cdkDrop = inject(CdkDropList);
  private readonly registry = inject(DndRegistryService);
  private readonly dndState = inject(DndStateService);

  openDropZoneId = input.required<string>();
  openDropZoneAccepts = input<string[] | string>([]);
  openDropZoneOrientation = input<'vertical' | 'horizontal'>('vertical');
  openDropZoneConnectedTo = input<string[] | string | undefined>(undefined);

  itemDropped = output<DropEvent>();

  private droppedSub?: any;

  constructor() {
    // Tự động đồng bộ các giá trị vào CdkDropList khi thay đổi
    effect(() => {
      const id = this.openDropZoneId();
      this.cdkDrop.id = id;

      const conn = this.openDropZoneConnectedTo();
      const resolved = Array.isArray(conn)
        ? conn
        : typeof conn === 'string'
          ? [conn]
          : this.registry.getConnectedTo(id);

      this.registry.register(id, resolved);
      this.cdkDrop.connectedTo = resolved;
    });
  }

  ngOnInit(): void {
    // Thiết lập enterPredicate để kiểm soát lọc kiểu dữ liệu chấp nhận (type filtering)
    this.cdkDrop.enterPredicate = (drag: CdkDrag) => {
      const dragItem = drag.data as DndItem;
      if (!dragItem || !dragItem.type) return true;

      const accepts = this.openDropZoneAccepts();
      const acceptList = Array.isArray(accepts)
        ? accepts
        : typeof accepts === 'string' && accepts.trim() !== ''
          ? [accepts]
          : [];

      return acceptList.length === 0 || acceptList.includes(dragItem.type);
    };

    // Lắng nghe sự kiện thả
    this.droppedSub = this.cdkDrop.dropped.subscribe((event: CdkDragDrop<any>) => {
      const item = event.item.data as DndItem;
      const dropEvent: DropEvent = {
        item,
        sourceZoneId: event.previousContainer.id,
        targetZoneId: event.container.id,
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
        dropPosition: event.dropPoint ? { x: event.dropPoint.x, y: event.dropPoint.y } : undefined,
      };

      this.itemDropped.emit(dropEvent);
    });
  }

  ngOnDestroy(): void {
    this.registry.unregister(this.openDropZoneId());
    this.droppedSub?.unsubscribe();
  }
}
