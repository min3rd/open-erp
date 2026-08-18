var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { PaginationComponent } from '../navigation/pagination/pagination.component';
import { CheckboxComponent } from '../form/checkbox/checkbox.component';
import { TableSortDirection } from '../../enums/component.enum';
let TableComponent = class TableComponent {
    columns = [];
    data = [];
    loading = false;
    striped = false;
    bordered = true;
    hoverable = true;
    compact = false;
    stickyHeader = false;
    maxHeight;
    emptyTitle = 'Không tìm thấy dữ liệu';
    emptyDescription = 'Chưa có bản ghi nào hoặc bộ lọc không khớp kết quả.';
    // Sắp xếp
    sortKey;
    sortDirection = TableSortDirection.NONE;
    sortChange = new EventEmitter();
    // Chọn dòng (Selection)
    selectable = false;
    selectedRows = [];
    selectedRowsChange = new EventEmitter();
    rowClick = new EventEmitter();
    // Phân trang
    pagination = false;
    currentPage = 1;
    pageSize = 10;
    totalItems = 0;
    pageSizeOptions = [10, 20, 50, 100];
    pageChange = new EventEmitter();
    pageSizeChange = new EventEmitter();
    get isAllSelected() {
        if (!this.data || this.data.length === 0)
            return false;
        return this.data.every(row => this.selectedRows.includes(row));
    }
    get isPartiallySelected() {
        if (!this.data || this.data.length === 0)
            return false;
        const count = this.data.filter(row => this.selectedRows.includes(row)).length;
        return count > 0 && count < this.data.length;
    }
    toggleSelectAll() {
        if (this.isAllSelected) {
            this.selectedRows = [];
        }
        else {
            this.selectedRows = [...this.data];
        }
        this.selectedRowsChange.emit(this.selectedRows);
    }
    toggleSelectRow(row, isChecked) {
        const shouldSelect = isChecked !== undefined ? isChecked : !this.isRowSelected(row);
        if (shouldSelect) {
            if (!this.selectedRows.includes(row)) {
                this.selectedRows = [...this.selectedRows, row];
            }
        }
        else {
            this.selectedRows = this.selectedRows.filter(r => r !== row);
        }
        this.selectedRowsChange.emit(this.selectedRows);
    }
    isRowSelected(row) {
        return this.selectedRows.includes(row);
    }
    handleSort(col) {
        if (!col.sortable)
            return;
        if (this.sortKey !== col.key) {
            this.sortKey = col.key;
            this.sortDirection = 'asc';
        }
        else {
            if (this.sortDirection === 'asc') {
                this.sortDirection = 'desc';
            }
            else if (this.sortDirection === 'desc') {
                this.sortDirection = 'none';
                this.sortKey = undefined;
            }
            else {
                this.sortDirection = 'asc';
            }
        }
        this.sortChange.emit({ key: col.key, direction: this.sortDirection });
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
__decorate([
    Input(),
    __metadata("design:type", Array)
], TableComponent.prototype, "columns", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], TableComponent.prototype, "data", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "striped", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "bordered", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "hoverable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "compact", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "stickyHeader", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TableComponent.prototype, "maxHeight", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TableComponent.prototype, "emptyTitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TableComponent.prototype, "emptyDescription", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TableComponent.prototype, "sortKey", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TableComponent.prototype, "sortDirection", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TableComponent.prototype, "sortChange", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "selectable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], TableComponent.prototype, "selectedRows", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TableComponent.prototype, "selectedRowsChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TableComponent.prototype, "rowClick", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TableComponent.prototype, "pagination", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], TableComponent.prototype, "currentPage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], TableComponent.prototype, "pageSize", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], TableComponent.prototype, "totalItems", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], TableComponent.prototype, "pageSizeOptions", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TableComponent.prototype, "pageChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TableComponent.prototype, "pageSizeChange", void 0);
TableComponent = __decorate([
    Component({
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
], TableComponent);
export { TableComponent };
//# sourceMappingURL=table.component.js.map