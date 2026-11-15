import { Directive, HostListener, computed, inject, input } from '@angular/core';
import { TableSortService } from './table-sort.service';

@Directive({
  selector: 'th[appTableSort]',
  host: {
    class: 'cursor-pointer select-none',
    '[attr.data-sort]': 'direction()',
    '[attr.aria-sort]': 'ariaSort()',
  },
})
export class TableSortHeaderDirective {
  /** Logical table id shared by all headers of the same table. */
  tableId = input.required<string>({ alias: 'appTableSort' });
  sortKey = input.required<string>();

  private sort = inject(TableSortService);
  readonly direction = computed(() => this.sort.direction(this.tableId(), this.sortKey()));
  readonly ariaSort = computed(() => {
    const direction = this.direction();
    return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';
  });

  @HostListener('click')
  toggle(): void {
    this.sort.toggle(this.tableId(), this.sortKey());
  }
}
