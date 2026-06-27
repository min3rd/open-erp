import { Component, input, output, ContentChild, TemplateRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { DndItem, DropEvent } from '../../../models/dnd.model';
import { OpenErpDropZoneDirective } from '../../../directives/dnd/open-erp-drop-zone.directive';
import { OpenErpDraggableDirective } from '../../../directives/dnd/open-erp-draggable.directive';

export interface DndTreeNode<T = unknown> extends DndItem<T> {
  children?: DndTreeNode<T>[];
  expanded?: boolean;
}

/**
 * oerp-sortable-tree
 * Component cây danh sách phân cấp (Nested Tree) hỗ trợ reorder lồng nhau.
 * Cho phép di chuyển phần tử từ nhánh này sang nhánh khác.
 */
@Component({
  selector: 'oerp-sortable-tree',
  standalone: true,
  imports: [
    CommonModule, 
    OpenErpDropZoneDirective, 
    OpenErpDraggableDirective, 
    forwardRef(() => SortableTreeComponent),
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './sortable-tree.component.html',
})
export class SortableTreeComponent {
  nodes = input.required<DndTreeNode[]>();
  allDropListIds = input<string[]>([]);
  customTemplate = input<TemplateRef<any> | undefined>(undefined);

  nodeDropped = output<DropEvent>();

  @ContentChild(TemplateRef) nodeTemplate?: TemplateRef<any>;

  onItemDropped(event: DropEvent): void {
    this.nodeDropped.emit(event);
  }
}
