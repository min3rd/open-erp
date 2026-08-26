import { PaginationVariant } from '../../../enums/component.enum';
export declare class PaginationComponent {
    readonly currentPage: import("@angular/core").ModelSignal<number>;
    readonly totalItems: import("@angular/core").InputSignal<number>;
    readonly pageSize: import("@angular/core").ModelSignal<number>;
    readonly pageSizeOptions: import("@angular/core").InputSignal<number[]>;
    readonly showPageSizeSelector: import("@angular/core").InputSignal<boolean>;
    readonly showTotalInfo: import("@angular/core").InputSignal<boolean>;
    readonly showJumpToPage: import("@angular/core").InputSignal<boolean>;
    readonly variant: import("@angular/core").InputSignal<"full" | "simple" | "compact" | PaginationVariant>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly pageChange: import("@angular/core").OutputEmitterRef<number>;
    jumpPageInput: number;
    readonly isFull: import("@angular/core").Signal<boolean>;
    readonly totalPages: import("@angular/core").Signal<number>;
    readonly startItem: import("@angular/core").Signal<number>;
    readonly endItem: import("@angular/core").Signal<number>;
    readonly pageNumbers: import("@angular/core").Signal<(string | number)[]>;
    setPage(page: number | string): void;
    onPageSizeChange(event: Event): void;
    onJumpPage(): void;
}
