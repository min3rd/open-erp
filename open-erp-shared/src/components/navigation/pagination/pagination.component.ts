import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PaginationComponent {
  readonly currentPage = model<number>(1);
  readonly totalItems = input<number>(0);
  readonly pageSize = model<number>(10);
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  readonly showPageSizeSelector = input<boolean>(true);
  readonly showTotalInfo = input<boolean>(true);
  readonly showJumpToPage = input<boolean>(false);
  readonly variant = input<PaginationVariant | 'full' | 'simple' | 'compact'>(PaginationVariant.FULL);
  readonly loading = input<boolean>(false);

  readonly pageChange = output<number>();

  jumpPageInput: number = 1;

  readonly isFull = computed(() => String(this.variant()) === 'full');

  readonly totalPages = computed(() => {
    const size = this.pageSize() || 10;
    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  readonly startItem = computed(() => {
    const tot = this.totalItems();
    if (tot === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly endItem = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  readonly pageNumbers = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

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
  });

  setPage(page: number | string): void {
    if (typeof page === 'string') return;
    const max = this.totalPages();
    if (page < 1 || page > max || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.pageChange.emit(page);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.pageChange.emit(1);
  }

  onJumpPage(): void {
    if (this.jumpPageInput >= 1 && this.jumpPageInput <= this.totalPages()) {
      this.setPage(this.jumpPageInput);
    }
  }
}
