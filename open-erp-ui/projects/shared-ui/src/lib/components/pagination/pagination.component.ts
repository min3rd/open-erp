import { Component, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-pagination',
  standalone: true,
  imports: [NgClass, IconComponent],
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {
  totalItems = input.required<number>();
  pageSize = input<number>(10);
  currentPage = input.required<number>();

  pageChange = output<number>();

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const visiblePages: number[] = [];
    
    // Simple pagination range builder
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end === total) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  });

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
