import { Directive, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { OpenErpDropZoneDirective } from './open-erp-drop-zone.directive';
import { SortEvent, DndItem } from '../../models/dnd.model';
import { moveItemInArray } from '@angular/cdk/drag-drop';

/**
 * OpenErpSortableDirective
 * Bao bọc danh sách hỗ trợ reorder các phần tử con.
 * Kế thừa toàn bộ hành vi của OpenErpDropZoneDirective thông qua Directive Composition.
 */
@Directive({
  selector: '[open-erp-sortable]',
  standalone: true,
  hostDirectives: [
    {
      directive: OpenErpDropZoneDirective,
      inputs: [
        'openDropZoneId: openSortableId',
        'openDropZoneOrientation: openSortableOrientation',
        'openDropZoneConnectedTo: openSortableConnectedTo',
      ],
    },
  ],
})
export class OpenErpSortableDirective implements OnInit, OnDestroy {
  private readonly dropZone = inject(OpenErpDropZoneDirective);

  openSortableItems = input.required<DndItem[]>();
  sortChanged = output<SortEvent>();

  private droppedSub?: any;

  ngOnInit(): void {
    this.droppedSub = this.dropZone.itemDropped.subscribe((event) => {
      // Chỉ xử lý sắp xếp nội bộ trong cùng danh sách
      if (event.sourceZoneId === event.targetZoneId) {
        const itemsCopy = [...this.openSortableItems()];
        const movedItem = event.item;

        moveItemInArray(itemsCopy, event.previousIndex, event.currentIndex);

        const sortEvent: SortEvent = {
          items: itemsCopy,
          movedItem,
          previousIndex: event.previousIndex,
          currentIndex: event.currentIndex,
        };

        this.sortChanged.emit(sortEvent);
      }
    });
  }

  ngOnDestroy(): void {
    this.droppedSub?.unsubscribe();
  }
}
