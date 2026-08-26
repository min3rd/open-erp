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
    readonly columns: import("@angular/core").InputSignal<TableColumn<T>[]>;
    readonly data: import("@angular/core").InputSignal<T[]>;
    readonly rowKey: import("@angular/core").InputSignal<string>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly striped: import("@angular/core").InputSignal<boolean>;
    readonly bordered: import("@angular/core").InputSignal<boolean>;
    readonly hoverable: import("@angular/core").InputSignal<boolean>;
    readonly compact: import("@angular/core").InputSignal<boolean>;
    readonly stickyHeader: import("@angular/core").InputSignal<boolean>;
    readonly maxHeight: import("@angular/core").InputSignal<string | undefined>;
    readonly emptyTitle: import("@angular/core").InputSignal<string>;
    readonly emptyDescription: import("@angular/core").InputSignal<string>;
    readonly sortKey: import("@angular/core").ModelSignal<string | undefined>;
    readonly sortDirection: import("@angular/core").ModelSignal<"none" | "asc" | "desc" | TableSortDirection>;
    readonly sortChange: import("@angular/core").OutputEmitterRef<{
        key: string;
        direction: TableSortDirection | "asc" | "desc" | "none";
    }>;
    readonly selectable: import("@angular/core").InputSignal<boolean>;
    readonly selectedRows: import("@angular/core").ModelSignal<T[]>;
    readonly rowClick: import("@angular/core").OutputEmitterRef<{
        row: T;
        index: number;
    }>;
    readonly pagination: import("@angular/core").InputSignal<boolean>;
    readonly currentPage: import("@angular/core").InputSignal<number>;
    readonly pageSize: import("@angular/core").InputSignal<number>;
    readonly totalItems: import("@angular/core").InputSignal<number>;
    readonly pageSizeOptions: import("@angular/core").InputSignal<number[]>;
    readonly pageChange: import("@angular/core").OutputEmitterRef<number>;
    readonly pageSizeChange: import("@angular/core").OutputEmitterRef<number>;
    readonly selectedKeysSet: import("@angular/core").Signal<Set<any>>;
    readonly isAllSelected: import("@angular/core").Signal<boolean>;
    readonly isPartiallySelected: import("@angular/core").Signal<boolean>;
    getRowIdentity(row: T, index: number): any;
    isRowSelected(row: T): boolean;
    toggleSelectAll(): void;
    toggleSelectRow(row: T, isChecked?: boolean): void;
    handleSort(col: TableColumn<T>): void;
    onRowClick(row: T, index: number): void;
    getCellValue(row: T, col: TableColumn<T>, index: number): any;
}
