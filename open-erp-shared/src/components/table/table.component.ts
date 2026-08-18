import { Component, Input, Output, EventEmitter, TemplateRef, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
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
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TableComponent<T = any> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading: boolean = false;
  @Input() striped: boolean = false;
  @Input() bordered: boolean = true;
  @Input() hoverable: boolean = true;
  @Input() compact: boolean = false;
  @Input() stickyHeader: boolean = false;
  @Input() maxHeight?: string;
  @Input() emptyTitle: string = 'Không tìm thấy dữ liệu';
  @Input() emptyDescription: string = 'Chưa có bản ghi nào hoặc bộ lọc không khớp kết quả.';

  // Sắp xếp
  @Input() sortKey?: string;
  @Input() sortDirection: TableSortDirection | 'asc' | 'desc' | 'none' = TableSortDirection.NONE;
  @Output() sortChange = new EventEmitter<{ key: string; direction: TableSortDirection | 'asc' | 'desc' | 'none' }>();

  // Chọn dòng (Selection)
  @Input() selectable: boolean = false;
  @Input() selectedRows: T[] = [];
  @Output() selectedRowsChange = new EventEmitter<T[]>();
  @Output() rowClick = new EventEmitter<{ row: T; index: number }>();

  // Phân trang
  @Input() pagination: boolean = false;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalItems: number = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get isAllSelected(): boolean {
    if (!this.data || this.data.length === 0) return false;
    return this.data.every(row => this.selectedRows.includes(row));
  }

  get isPartiallySelected(): boolean {
    if (!this.data || this.data.length === 0) return false;
    const count = this.data.filter(row => this.selectedRows.includes(row)).length;
    return count > 0 && count < this.data.length;
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedRows = [];
    } else {
      this.selectedRows = [...this.data];
    }
    this.selectedRowsChange.emit(this.selectedRows);
  }

  toggleSelectRow(row: T, isChecked?: boolean): void {
    const shouldSelect = isChecked !== undefined ? isChecked : !this.isRowSelected(row);
    if (shouldSelect) {
      if (!this.selectedRows.includes(row)) {
        this.selectedRows = [...this.selectedRows, row];
      }
    } else {
      this.selectedRows = this.selectedRows.filter(r => r !== row);
    }
    this.selectedRowsChange.emit(this.selectedRows);
  }

  isRowSelected(row: T): boolean {
    return this.selectedRows.includes(row);
  }

  handleSort(col: TableColumn<T>): void {
    if (!col.sortable) return;
    if (this.sortKey !== col.key) {
      this.sortKey = col.key;
      this.sortDirection = 'asc';
    } else {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = 'none';
        this.sortKey = undefined;
      } else {
        this.sortDirection = 'asc';
      }
    }
    this.sortChange.emit({ key: col.key, direction: this.sortDirection });
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
