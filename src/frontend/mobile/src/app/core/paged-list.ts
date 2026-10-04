import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiErrorResponse } from '@shared';

export interface PagedPayload<T> {
  data?: { items?: T[]; total_pages?: number } | null;
}

/**
 * Reset/append/load-more state shared by the mobile settings lists.
 * Callers supply the fetch call; this owns paging, loading flags and the
 * debounced-search timer. Page numbers are 1-based (the sample-record service
 * converts to its 0-based API).
 */
export class PagedList<T> {
  readonly items = signal<T[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly fetchPage: (page: number) => Observable<PagedPayload<T>>,
    private readonly onError: (err: ApiErrorResponse) => void,
    private readonly onLoaded?: () => void
  ) {}

  load(reset: boolean): void {
    if (!reset && !this.hasMore()) {
      return;
    }
    if (reset) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }
    const requested = reset ? 1 : this.page() + 1;
    this.fetchPage(requested).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.items.set(reset ? items : [...this.items(), ...items]);
        this.totalPages.set(res.data?.total_pages || 1);
        this.page.set(requested);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.onLoaded?.();
      },
      error: (err) => {
        if (reset) {
          this.items.set([]);
        }
        this.loading.set(false);
        this.loadingMore.set(false);
        this.onError(err);
      }
    });
  }

  hasMore(): boolean {
    return this.page() > 0 && this.page() < this.totalPages();
  }

  /** Trailing-edge debounce shared by the search boxes. */
  debounce(fn: () => void, ms = 300): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(fn, ms);
  }
}
