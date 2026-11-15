import { Injectable, signal } from '@angular/core';

export type TableSortDirection = 'asc' | 'desc';

interface TableSortState {
  key: string;
  direction: TableSortDirection;
}

/** Shared sort state for plain HTML tables (one state per logical table id). */
@Injectable({ providedIn: 'root' })
export class TableSortService {
  private readonly state = signal<Record<string, TableSortState>>({});

  toggle(tableId: string, key: string): void {
    const current = this.state()[tableId];
    const direction: TableSortDirection =
      current?.key === key && current.direction === 'asc' ? 'desc' : 'asc';
    this.state.update((all) => ({ ...all, [tableId]: { key, direction } }));
  }

  direction(tableId: string, key: string): TableSortDirection | null {
    const current = this.state()[tableId];
    return current?.key === key ? current.direction : null;
  }

  sortRows<T>(tableId: string, rows: T[]): T[] {
    const current = this.state()[tableId];
    if (!current) {
      return rows;
    }
    const factor = current.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      const a = (left as Record<string, unknown>)[current.key];
      const b = (right as Record<string, unknown>)[current.key];
      if (a === b) return 0;
      if (a === null || a === undefined) return 1;
      if (b === null || b === undefined) return -1;
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor;
      return String(a).localeCompare(String(b), undefined, { numeric: true }) * factor;
    });
  }
}
