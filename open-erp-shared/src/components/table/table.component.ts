import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { PaginationComponent } from '../navigation/pagination/pagination.component';
import { CheckboxComponent } from '../form/checkbox/checkbox.component';
import { TableSortDirection } from '../../enums/component.enum';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
  formatter?: (val: any, row: T, index: number) => string;
}

@Component({
  selector: 'erp-table, erp-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, EmptyStateComponent, PaginationComponent, CheckboxComponent],
  templateUrl: './table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TableComponent<T = any> {
  readonly columns = input<TableColumn<T>[]>([]);
  readonly data = input<T[]>([]);
  readonly rowKey = input<string>('id');
  readonly loading = input<boolean>(false);
  readonly striped = input<boolean>(false);
  readonly bordered = input<boolean>(true);
  readonly hoverable = input<boolean>(true);
  readonly compact = input<boolean>(false);
  readonly stickyHeader = input<boolean>(false);
  readonly maxHeight = input<string | undefined>(undefined);
  readonly emptyTitle = input<string>('Không tìm thấy dữ liệu');
  readonly emptyDescription = input<string>('Chưa có bản ghi nào hoặc bộ lọc không khớp kết quả.');

  // Sắp xếp
  readonly sortKey = model<string | undefined>(undefined);
  readonly sortDirection = model<TableSortDirection | 'asc' | 'desc' | 'none'>(TableSortDirection.NONE);
  readonly sortChange = output<{ key: string; direction: TableSortDirection | 'asc' | 'desc' | 'none' }>();

  // Chọn dòng (Selection)
  readonly selectable = input<boolean>(false);
  readonly selectedRows = model<T[]>([]);
  readonly rowClick = output<{ row: T; index: number }>();

  // Phân trang
  readonly pagination = input<boolean>(false);
  readonly currentPage = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalItems = input<number>(0);
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly selectedKeysSet = computed(() => {
    const key = this.rowKey();
    const rows = this.selectedRows();
    const set = new Set<any>();
    for (const r of rows) {
      set.add(key && (r as any)[key] !== undefined ? (r as any)[key] : r);
    }
    return set;
  });

  readonly isAllSelected = computed(() => {
    const list = this.data();
    if (!list || list.length === 0) return false;
    const set = this.selectedKeysSet();
    const key = this.rowKey();
    return list.every(row => set.has(key && (row as any)[key] !== undefined ? (row as any)[key] : row));
  });

  readonly isPartiallySelected = computed(() => {
    const list = this.data();
    if (!list || list.length === 0) return false;
    const set = this.selectedKeysSet();
    const key = this.rowKey();
    let count = 0;
    for (const row of list) {
      if (set.has(key && (row as any)[key] !== undefined ? (row as any)[key] : row)) {
        count++;
      }
    }
    return count > 0 && count < list.length;
  });

  getRowIdentity(row: T, index: number): any {
    const key = this.rowKey();
    return key && (row as any)[key] !== undefined ? (row as any)[key] : index;
  }

  isRowSelected(row: T): boolean {
    const key = this.rowKey();
    const target = key && (row as any)[key] !== undefined ? (row as any)[key] : row;
    return this.selectedKeysSet().has(target);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedRows.set([]);
    } else {
      this.selectedRows.set([...this.data()]);
    }
  }

  toggleSelectRow(row: T, isChecked?: boolean): void {
    const currentlySelected = this.isRowSelected(row);
    const shouldSelect = isChecked !== undefined ? isChecked : !currentlySelected;
    const current = this.selectedRows();
    const key = this.rowKey();
    const target = key && (row as any)[key] !== undefined ? (row as any)[key] : row;

    if (shouldSelect) {
      if (!currentlySelected) {
        this.selectedRows.set([...current, row]);
      }
    } else {
      this.selectedRows.set(current.filter(r => (key && (r as any)[key] !== undefined ? (r as any)[key] : r) !== target));
    }
  }

  handleSort(col: TableColumn<T>): void {
    if (!col.sortable) return;
    let nextDir: TableSortDirection | 'asc' | 'desc' | 'none' = 'asc';
    let nextKey: string | undefined = col.key;

    if (this.sortKey() !== col.key) {
      nextDir = 'asc';
      nextKey = col.key;
    } else {
      if (this.sortDirection() === 'asc') {
        nextDir = 'desc';
      } else if (this.sortDirection() === 'desc') {
        nextDir = 'none';
        nextKey = undefined;
      } else {
        nextDir = 'asc';
      }
    }

    this.sortKey.set(nextKey);
    this.sortDirection.set(nextDir);
    this.sortChange.emit({ key: col.key, direction: nextDir });
  }

  onRowClick(row: T, index: number): void {
    this.rowClick.emit({ row, index });
  }

  getCellValue(row: T, col: TableColumn<T>, index: number): any {
    if (col.formatter) {
      return col.formatter((row as any)[col.key], row, index);
    }
    return (row as any)[col.key] ?? '—';
  }
}
