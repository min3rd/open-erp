import { Directive, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { DndItem } from '../../models/dnd.model';
import { DndStateService } from '../../services/dnd/dnd-state.service';

/**
 * OpenErpDraggableDirective
 * Đánh dấu phần tử có thể kéo đi. Bọc quanh CdkDrag của Angular CDK.
 */
@Directive({
  selector: '[open-erp-draggable]',
  standalone: true,
})
export class OpenErpDraggableDirective implements OnInit, OnDestroy {
  private readonly cdkDrag = inject(CdkDrag);
  private readonly dndState = inject(DndStateService);

  openDraggableData = input.required<DndItem>();
  openDraggableDisabled = input<boolean>(false);

  dragStarted = output<DndItem>();
  dragEnded = output<{ item: DndItem; event: any }>();

  private startSub?: any;
  private endedSub?: any;

  ngOnInit(): void {
    // Lưu thông tin item vào state service khi bắt đầu kéo
    this.startSub = this.cdkDrag.started.subscribe(() => {
      const item = this.openDraggableData();
      this.dndState.startDrag(item, '');
      this.dragStarted.emit(item);
    });

    this.endedSub = this.cdkDrag.ended.subscribe((event) => {
      const item = this.openDraggableData();
      this.dndState.endDrag();
      this.dragEnded.emit({ item, event });
    });
  }

  ngOnDestroy(): void {
    this.startSub?.unsubscribe();
    this.endedSub?.unsubscribe();
  }
}
