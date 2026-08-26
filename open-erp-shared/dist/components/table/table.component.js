var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { PaginationComponent } from '../navigation/pagination/pagination.component';
import { CheckboxComponent } from '../form/checkbox/checkbox.component';
import { TableSortDirection } from '../../enums/component.enum';
let TableComponent = class TableComponent {
    columns = input([]);
    data = input([]);
    rowKey = input('id');
    loading = input(false);
    striped = input(false);
    bordered = input(true);
    hoverable = input(true);
    compact = input(false);
    stickyHeader = input(false);
    maxHeight = input(undefined);
    emptyTitle = input('Không tìm thấy dữ liệu');
    emptyDescription = input('Chưa có bản ghi nào hoặc bộ lọc không khớp kết quả.');
    // Sắp xếp
    sortKey = model(undefined);
    sortDirection = model(TableSortDirection.NONE);
    sortChange = output();
    // Chọn dòng (Selection)
    selectable = input(false);
    selectedRows = model([]);
    rowClick = output();
    // Phân trang
    pagination = input(false);
    currentPage = input(1);
    pageSize = input(10);
    totalItems = input(0);
    pageSizeOptions = input([10, 20, 50, 100]);
    pageChange = output();
    pageSizeChange = output();
    selectedKeysSet = computed(() => {
        const key = this.rowKey();
        const rows = this.selectedRows();
        const set = new Set();
        for (const r of rows) {
            set.add(key && r[key] !== undefined ? r[key] : r);
        }
        return set;
    });
    isAllSelected = computed(() => {
        const list = this.data();
        if (!list || list.length === 0)
            return false;
        const set = this.selectedKeysSet();
        const key = this.rowKey();
        return list.every(row => set.has(key && row[key] !== undefined ? row[key] : row));
    });
    isPartiallySelected = computed(() => {
        const list = this.data();
        if (!list || list.length === 0)
            return false;
        const set = this.selectedKeysSet();
        const key = this.rowKey();
        let count = 0;
        for (const row of list) {
            if (set.has(key && row[key] !== undefined ? row[key] : row)) {
                count++;
            }
        }
        return count > 0 && count < list.length;
    });
    getRowIdentity(row, index) {
        const key = this.rowKey();
        return key && row[key] !== undefined ? row[key] : index;
    }
    isRowSelected(row) {
        const key = this.rowKey();
        const target = key && row[key] !== undefined ? row[key] : row;
        return this.selectedKeysSet().has(target);
    }
    toggleSelectAll() {
        if (this.isAllSelected()) {
            this.selectedRows.set([]);
        }
        else {
            this.selectedRows.set([...this.data()]);
        }
    }
    toggleSelectRow(row, isChecked) {
        const currentlySelected = this.isRowSelected(row);
        const shouldSelect = isChecked !== undefined ? isChecked : !currentlySelected;
        const current = this.selectedRows();
        const key = this.rowKey();
        const target = key && row[key] !== undefined ? row[key] : row;
        if (shouldSelect) {
            if (!currentlySelected) {
                this.selectedRows.set([...current, row]);
            }
        }
        else {
            this.selectedRows.set(current.filter(r => (key && r[key] !== undefined ? r[key] : r) !== target));
        }
    }
    handleSort(col) {
        if (!col.sortable)
            return;
        let nextDir = 'asc';
        let nextKey = col.key;
        if (this.sortKey() !== col.key) {
            nextDir = 'asc';
            nextKey = col.key;
        }
        else {
            if (this.sortDirection() === 'asc') {
                nextDir = 'desc';
            }
            else if (this.sortDirection() === 'desc') {
                nextDir = 'none';
                nextKey = undefined;
            }
            else {
                nextDir = 'asc';
            }
        }
        this.sortKey.set(nextKey);
        this.sortDirection.set(nextDir);
        this.sortChange.emit({ key: col.key, direction: nextDir });
    }
    onRowClick(row, index) {
        this.rowClick.emit({ row, index });
    }
    getCellValue(row, col, index) {
        if (col.formatter) {
            return col.formatter(row[col.key], row, index);
        }
        return row[col.key] ?? '—';
    }
};
TableComponent = __decorate([
    Component({
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
], TableComponent);
export { TableComponent };
//# sourceMappingURL=table.component.js.map