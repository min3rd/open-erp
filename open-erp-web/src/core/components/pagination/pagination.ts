import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/paginator';
import { PAGE_SIZE_OPTIONS } from '../../constant';

export interface PaginationChange {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'core-pagination',
  imports: [CommonModule, TranslocoModule, PaginatorModule],
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent implements AfterViewInit {
  totalRecords = input<number>(0);
  currentPage = input<number>(1);
  pageSize = input<number>(PAGE_SIZE_OPTIONS[0]);
  pageLinkSize = input<number>(5);
  idPrefix = input<string>('pagination');

  pageChange = output<PaginationChange>();
  navigateTo = output<number>();
  changePageSize = output<number>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private viewInitialized = false;
  private destroyed = false;
  private pendingAttributeUpdate = false;

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalRecords() / this.pageSize())),
  );

  protected readonly currentPageValue = computed(() => {
    const page = this.currentPage();
    return Math.min(Math.max(page || 1, 1), this.totalPages());
  });

  protected readonly paginationId = computed(() => `${this.idPrefix()}-pagination`);
  protected readonly firstButtonId = computed(() => `${this.idPrefix()}-pagination-first-button`);
  protected readonly prevButtonId = computed(() => `${this.idPrefix()}-pagination-prev-button`);
  protected readonly nextButtonId = computed(() => `${this.idPrefix()}-pagination-next-button`);
  protected readonly lastButtonId = computed(() => `${this.idPrefix()}-pagination-last-button`);
  protected readonly pageSizeId = computed(() => `${this.idPrefix()}-pagination-page-size`);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
    effect(() => {
      this.currentPage();
      this.pageSize();
      this.totalRecords();
      this.pageLinkSize();
      if (this.viewInitialized) {
        this.scheduleAttributeUpdate();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.scheduleAttributeUpdate();
  }

  protected onPaginatorChange(event: PaginatorState): void {
    const newPageSize = event.rows ?? this.pageSize();
    const isPageSizeChange = newPageSize !== this.pageSize();
    const targetPage = isPageSizeChange
      ? this.calculateTargetPageForNewSize(newPageSize)
      : (event.page ?? 0) + 1;

    if (isPageSizeChange) {
      this.changePageSize.emit(newPageSize);
    }

    this.emitChange(targetPage, newPageSize);
    this.scheduleAttributeUpdate();
  }

  private emitChange(page: number, pageSize: number): void {
    const totalPages = Math.max(1, Math.ceil(this.totalRecords() / pageSize));
    const targetPage = Math.min(Math.max(page, 1), totalPages);

    this.pageChange.emit({ page: targetPage, pageSize });
    this.navigateTo.emit(targetPage);
  }

  private calculateTargetPageForNewSize(newPageSize: number): number {
    const firstItemIndex = (this.currentPageValue() - 1) * this.pageSize() + 1;
    return Math.ceil(firstItemIndex / newPageSize);
  }

  private scheduleAttributeUpdate(): void {
    if (this.pendingAttributeUpdate || this.destroyed) {
      return;
    }
    this.pendingAttributeUpdate = true;
    queueMicrotask(() => {
      if (this.destroyed) {
        return;
      }
      this.pendingAttributeUpdate = false;
      this.applyPaginatorAttributes();
    });
  }

  private applyPaginatorAttributes(): void {
    const host = this.host.nativeElement;
    this.applyButtonAttributes(
      host.querySelector('button.p-paginator-first') as HTMLButtonElement | null,
      this.firstButtonId(),
      this.translocoService.translate('pagination.first'),
    );
    this.applyButtonAttributes(
      host.querySelector('button.p-paginator-prev') as HTMLButtonElement | null,
      this.prevButtonId(),
      this.translocoService.translate('pagination.previous'),
    );
    this.applyButtonAttributes(
      host.querySelector('button.p-paginator-next') as HTMLButtonElement | null,
      this.nextButtonId(),
      this.translocoService.translate('pagination.next'),
    );
    this.applyButtonAttributes(
      host.querySelector('button.p-paginator-last') as HTMLButtonElement | null,
      this.lastButtonId(),
      this.translocoService.translate('pagination.last'),
    );

    const pageButtons = Array.from(
      host.querySelectorAll('button.p-paginator-page'),
    ) as HTMLButtonElement[];
    pageButtons.forEach((button: HTMLButtonElement) => {
      const pageNumber = Number(button.textContent?.trim());
      if (!Number.isNaN(pageNumber)) {
        this.renderer.setAttribute(
          button,
          'id',
          `${this.idPrefix()}-pagination-page-${pageNumber}`,
        );
        this.renderer.setAttribute(
          button,
          'aria-label',
          this.translocoService.translate('pagination.page', { page: pageNumber }),
        );
      }
    });

    const rowsDropdown = host.querySelector('.p-paginator-rpp-dropdown') as HTMLElement | null;
    if (rowsDropdown) {
      this.renderer.setAttribute(rowsDropdown, 'id', this.pageSizeId());
      this.renderer.setAttribute(
        rowsDropdown,
        'aria-label',
        this.translocoService.translate('pagination.pageSize'),
      );
      const dropdownButton = rowsDropdown.querySelector('button') as HTMLButtonElement | null;
      if (dropdownButton) {
        this.renderer.setAttribute(
          dropdownButton,
          'aria-label',
          this.translocoService.translate('pagination.pageSize'),
        );
      }
    }
  }

  private applyButtonAttributes(
    button: HTMLButtonElement | null,
    id: string,
    ariaLabel: string,
  ): void {
    if (!button) {
      return;
    }
    this.renderer.setAttribute(button, 'id', id);
    this.renderer.setAttribute(button, 'aria-label', ariaLabel);
  }
}
