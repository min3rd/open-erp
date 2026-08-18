import { EventEmitter } from '@angular/core';
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
export declare class TableComponent<T = any> {
    columns: TableColumn<T>[];
    data: T[];
    loading: boolean;
    striped: boolean;
    bordered: boolean;
    hoverable: boolean;
    compact: boolean;
    stickyHeader: boolean;
    maxHeight?: string;
    emptyTitle: string;
    emptyDescription: string;
    sortKey?: string;
    sortDirection: TableSortDirection | 'asc' | 'desc' | 'none';
    sortChange: EventEmitter<{
        key: string;
        direction: TableSortDirection | "asc" | "desc" | "none";
    }>;
    selectable: boolean;
    selectedRows: T[];
    selectedRowsChange: EventEmitter<T[]>;
    rowClick: EventEmitter<{
        row: T;
        index: number;
    }>;
    pagination: boolean;
    currentPage: number;
    pageSize: number;
    totalItems: number;
    pageSizeOptions: number[];
    pageChange: EventEmitter<number>;
    pageSizeChange: EventEmitter<number>;
    get isAllSelected(): boolean;
    get isPartiallySelected(): boolean;
    toggleSelectAll(): void;
    toggleSelectRow(row: T, isChecked?: boolean): void;
    isRowSelected(row: T): boolean;
    handleSort(col: TableColumn<T>): void;
    onRowClick(row: T, index: number): void;
    getCellValue(row: T, col: TableColumn<T>, index: number): any;
}
