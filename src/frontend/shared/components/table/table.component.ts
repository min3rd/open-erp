import { Component, TemplateRef, contentChild, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TableColumn } from '../../models/ui.model';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './table.component.html'
})
export class TableComponent {
  columns = input<TableColumn[]>([]);
  rows = input<any[]>([]);
  loading = input<boolean>(false);
  emptyKey = input<string>('COMMON_NO_DATA');

  rowTemplate = contentChild.required(TemplateRef);

  headerClasses(column: TableColumn): string {
    const base = 'px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 whitespace-nowrap border-b border-neutral-200 dark:border-neutral-800';
    const align = column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';
    const mono = column.mono ? ' font-mono' : '';
    return `${base} ${align}${mono}`;
  }
}
