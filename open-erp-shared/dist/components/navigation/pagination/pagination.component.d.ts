import { EventEmitter } from '@angular/core';
import { PaginationVariant } from '../../../enums/component.enum';
export declare class PaginationComponent {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    pageSizeOptions: number[];
    showPageSizeSelector: boolean;
    showTotalInfo: boolean;
    showJumpToPage: boolean;
    variant: PaginationVariant | 'full' | 'simple' | 'compact';
    loading: boolean;
    pageChange: EventEmitter<number>;
    pageSizeChange: EventEmitter<number>;
    jumpPageInput: number;
    get isFull(): boolean;
    get totalPages(): number;
    get startItem(): number;
    get endItem(): number;
    get pageNumbers(): (number | string)[];
    setPage(page: number | string): void;
    onPageSizeChange(event: Event): void;
    onJumpPage(): void;
}
