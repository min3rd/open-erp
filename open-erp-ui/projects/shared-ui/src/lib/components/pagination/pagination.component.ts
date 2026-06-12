import { Component, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-pagination',
  standalone: true,
  imports: [NgClass, IconComponent],
  template: `
    <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 select-none">
      <div class="flex flex-1 justify-between sm:hidden">
        <button
          (click)="prevPage()"
          [disabled]="currentPage() === 1"
          class="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Trước
        </button>
        <button
          (click)="nextPage()"
          [disabled]="currentPage() === totalPages()"
          class="relative ml-3 inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Sau
        </button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Hiển thị trang <span class="font-bold text-rose-gold-600 dark:text-rose-gold-400">{{ currentPage() }}</span> / <span class="font-bold">{{ totalPages() }}</span>
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              (click)="prevPage()"
              [disabled]="currentPage() === 1"
              class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 dark:text-slate-500 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              <span class="sr-only">Previous</span>
              <oerp-icon name="chevron-left" [size]="16" class="flex items-center"></oerp-icon>
            </button>
            
            @for (page of pages(); track page) {
              <button
                (click)="pageChange.emit(page)"
                [ngClass]="[
                  'relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 outline-none cursor-pointer',
                  page === currentPage()
                    ? 'z-10 bg-rose-gold-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-gold-500'
                    : 'text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-offset-0'
                ]"
              >
                {{ page }}
              </button>
            }

            <button
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages()"
              class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 dark:text-slate-500 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              <span class="sr-only">Next</span>
              <oerp-icon name="chevron-right" [size]="16" class="flex items-center"></oerp-icon>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `
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
