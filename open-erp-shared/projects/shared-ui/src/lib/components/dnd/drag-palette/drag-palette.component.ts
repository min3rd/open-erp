import { Component, input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndItem } from '../../../models/dnd.model';
import { OpenErpDropZoneDirective } from '../../../directives/dnd/open-erp-drop-zone.directive';
import { OpenErpDraggableDirective } from '../../../directives/dnd/open-erp-draggable.directive';
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';

/**
 * oerp-drag-palette
 * Bảng chứa các phần tử mẫu (Palette) để kéo sang các drop zone khác.
 * Khi kéo khỏi palette, phần tử mẫu gốc vẫn được giữ lại tại palette.
 */
@Component({
  selector: 'oerp-drag-palette',
  standalone: true,
  imports: [
    CommonModule,
    OpenErpDropZoneDirective,
    OpenErpDraggableDirective,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './drag-palette.component.html',
})
export class DragPaletteComponent {
  id = input<string>('drag-palette');
  items = input.required<DndItem[]>();
  connectedTo = input<string[] | string>();
  paletteClass = input<string>(
    'flex flex-col gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
  );
  itemClass = input<string>('');

  @ContentChild(TemplateRef) itemTemplate?: TemplateRef<any>;
}
