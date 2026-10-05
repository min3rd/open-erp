import { Component, TemplateRef, contentChild, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ContextMenuItem } from '../../models/context-menu.model';
import { TableColumn } from '../../models/ui.model';
import { ContextMenuService } from '../context-menu/context-menu.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './table.component.html'
})
export class TableComponent {
  private contextMenu = inject(ContextMenuService);

  columns = input<TableColumn[]>([]);
  rows = input<any[]>([]);
  loading = input<boolean>(false);
  emptyKey = input<string>('COMMON_NO_DATA');
  /** Opt-in: resolve context-menu items for a row, or leave null to disable. */
  contextMenuItems = input<((row: any, index: number) => ContextMenuItem[]) | null>(null);

  rowTemplate = contentChild.required(TemplateRef);

  headerClasses(column: TableColumn): string {
    const base = 'px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap border-b border-default';
    const align = column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';
    const mono = column.mono ? ' font-mono' : '';
    return `${base} ${align}${mono}`;
  }

  onRowContextMenu(event: MouseEvent): void {
    const resolver = this.contextMenuItems();
    if (!resolver) {
      return;
    }
    const rowEl = (event.target as HTMLElement).closest('tr');
    if (!rowEl?.parentElement) {
      return;
    }
    const index = Array.from(rowEl.parentElement.children).indexOf(rowEl);
    const row = this.rows()[index];
    if (row === undefined) {
      return;
    }
    event.preventDefault();
    this.contextMenu.open({ x: event.clientX, y: event.clientY, items: resolver(row, index) });
  }
}
