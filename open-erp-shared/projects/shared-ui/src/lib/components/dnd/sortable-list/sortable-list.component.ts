import { Component, input, output, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndItem, SortEvent } from '../../../models/dnd.model';
import { OpenErpSortableDirective } from '../../../directives/dnd/open-erp-sortable.directive';
import { OpenErpDraggableDirective } from '../../../directives/dnd/open-erp-draggable.directive';

/**
 * oerp-sortable-list
 * Component danh sách kéo thả để sắp xếp lại vị trí.
 * Hỗ trợ template động thông qua ng-template truyền vào.
 */
@Component({
  selector: 'oerp-sortable-list',
  standalone: true,
  imports: [CommonModule, OpenErpSortableDirective, OpenErpDraggableDirective],
  templateUrl: './sortable-list.component.html',
})
export class SortableListComponent {
  id = input<string>('sortable-list');
  items = input.required<DndItem[]>();
  orientation = input<'vertical' | 'horizontal'>('vertical');
  connectedTo = input<string[] | string | undefined>(undefined);
  listClass = input<string>(
    'flex flex-col gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
  );
  itemClass = input<string>('');

  reordered = output<SortEvent>();

  @ContentChild(TemplateRef) itemTemplate?: TemplateRef<any>;

  onSortChanged(event: SortEvent): void {
    this.reordered.emit(event);
  }
}
