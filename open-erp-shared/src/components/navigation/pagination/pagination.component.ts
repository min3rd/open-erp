import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { PaginationVariant } from '../../../enums/component.enum';

@Component({
  selector: 'erp-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent],
  templateUrl: './pagination.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Input() showPageSizeSelector: boolean = true;
  @Input() showTotalInfo: boolean = true;
  @Input() showJumpToPage: boolean = false;
  @Input() variant: PaginationVariant | 'full' | 'simple' | 'compact' = PaginationVariant.FULL;
  @Input() loading: boolean = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  jumpPageInput: number = 1;

  get isFull(): boolean {
    return String(this.variant) === 'full';
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / (this.pageSize || 10)));
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }

    return pages;
  }

  setPage(page: number | string): void {
    if (typeof page === 'string') return;
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.pageChange.emit(this.currentPage);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.pageSize = newSize;
    this.currentPage = 1;
    this.pageSizeChange.emit(newSize);
    this.pageChange.emit(1);
  }

  onJumpPage(): void {
    if (this.jumpPageInput >= 1 && this.jumpPageInput <= this.totalPages) {
      this.setPage(this.jumpPageInput);
    }
  }
}
