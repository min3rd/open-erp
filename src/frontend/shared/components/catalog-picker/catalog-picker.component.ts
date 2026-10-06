import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SizeVariant } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ApiErrorResponse, PagedData } from '../../models/api.model';
import {
  CatalogInlineCreateRequest,
  CatalogItemRef,
  CatalogLookupOptionsQuery,
  CatalogOptionItem,
  CatalogPickerMode
} from '../../models/catalog.model';
import { CatalogService } from '../../services/catalog.service';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const SEARCH_DEBOUNCE_MS = 250;
const OPTIONS_PAGE_SIZE = 20;
/** Upper bound of the page-0 cache (search text can be arbitrarily varied). */
const PAGE_CACHE_LIMIT = 30;
const EMPTY_PAGE: PagedData<CatalogOptionItem> = {
  items: [],
  page: 0,
  size: OPTIONS_PAGE_SIZE,
  total_items: 0,
  total_pages: 0
};

/**
 * Shared catalogue field (Web + Mobile): lazy autocomplete over
 * `GET /catalog/lookup/{typeCode}/options` with optional free text and
 * quick-create. The option list is an inline dropdown anchored to the field —
 * never a modal (DES-UI-S05-001 §3).
 */
@Component({
  selector: 'app-catalog-picker',
  standalone: true,
  imports: [TranslatePipe, IconComponent, SkeletonComponent],
  templateUrl: './catalog-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(keydown)': 'onKeydown($event)'
  }
})
export class CatalogPickerComponent {
  private catalog = inject(CatalogService);
  private destroyRef = inject(DestroyRef);
  private host = inject(ElementRef<HTMLElement>);
  private searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

  /** Catalogue type code, e.g. `PROVINCE`, `JOB_TITLE` (required). */
  typeCode = input.required<string>();
  /** Single or multi selection (mirrors the type's `multiple` flag). */
  mode = input<CatalogPickerMode | 'single' | 'multi'>(CatalogPickerMode.SINGLE);
  /** Dependent picker filter, e.g. communes of the chosen province. */
  parentId = input<string | null>(null);
  /** Point-in-time lookup (ISO-8601); `null` = now. */
  asOf = input<string | null>(null);
  /** i18n key of the search placeholder. */
  placeholderKey = input<string>('CATALOG_PICKER_SEARCH_PLACEHOLDER');
  /** Allow committing a typed value that is not in the catalogue. */
  allowFreeText = input<boolean>(false);
  /** Show "save to catalogue" (requires `catalog:item:inline-create`). */
  canInlineCreate = input<boolean>(false);
  disabled = input<boolean>(false);
  /** Shared design token; controls the field/row text density. */
  size = input<SizeVariant | `${SizeVariant}`>(SizeVariant.SM);

  /** Selected value(s): `CatalogItemRef` in single mode, array in multi mode. */
  selectionChange = output<CatalogItemRef | CatalogItemRef[] | null>();
  /** Raw typed value when a free-text value is committed (`null` when removed). */
  freeTextChange = output<string | null>();

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  readonly multiple = computed(
    () => this.mode() === CatalogPickerMode.MULTI || (this.mode() as string) === 'multi'
  );
  readonly query = signal('');
  readonly open = signal(false);
  readonly selected = signal<CatalogItemRef[]>([]);
  readonly items = signal<CatalogOptionItem[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly optionsError = signal<ApiErrorResponse | null>(null);
  readonly inlineSaving = signal(false);
  readonly inlineError = signal<ApiErrorResponse | null>(null);
  readonly inlineSaved = signal(false);
  readonly activeIndex = signal(-1);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalItems = signal(0);

  readonly listId = `catalog-picker-list-${Math.random().toString(36).substring(2, 9)}`;
  readonly inputId = `catalog-picker-input-${Math.random().toString(36).substring(2, 9)}`;

  readonly freeText = computed(() => this.query().trim());
  readonly hasMore = computed(() => this.totalPages() > 0 && this.page() + 1 < this.totalPages());
  readonly textClass = computed(() => {
    const size = this.size() as string;
    return size === SizeVariant.MD || size === 'md' || size === SizeVariant.LG || size === 'lg' || size === 'xl'
      ? 'text-sm'
      : 'text-xs';
  });
  readonly inputClass = computed(
    () =>
      `min-h-10 min-w-[6rem] flex-1 border-0 bg-transparent p-1 text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed sm:min-h-0 ${this.textClass()}`
  );

  /** "Use free text" row only when the typed value does not exactly match an option. */
  readonly showFreeTextRow = computed(() => {
    const text = this.freeText().toLowerCase();
    if (!this.allowFreeText() || !text || this.loading() || this.optionsError()) {
      return false;
    }
    return !this.items().some((item) => item.name.toLowerCase() === text);
  });
  readonly showInlineSave = computed(
    () =>
      this.allowFreeText() &&
      this.canInlineCreate() &&
      !!this.freeText() &&
      !this.loading() &&
      !this.optionsError()
  );
  readonly inlineErrorMessage = computed(() => {
    const error = this.inlineError();
    if (!error) {
      return '';
    }
    return error.code === 'CATALOG_LOOKUP_INLINE_DUPLICATE'
      ? 'CATALOG_PICKER_INLINE_DUPLICATE'
      : 'CATALOG_PICKER_INLINE_FAILED';
  });

  /** Option code by item id, for the chip tooltip (DES-UI-S05-001 §3.5). */
  private readonly codeById = new Map<string, string>();
  /** Page-0 cache keyed by (type, parent, as_of, q). ponytail: page 0 only. */
  private readonly pageCache = new Map<string, PagedData<CatalogOptionItem>>();
  private requestSeq = 0;
  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      // Dependent-picker sources changed: drop the loaded page (and cache the
      // reload for the next open).
      this.typeCode();
      this.parentId();
      this.asOf();
      this.items.set([]);
      this.page.set(0);
      this.totalPages.set(0);
      this.totalItems.set(0);
      this.activeIndex.set(-1);
      this.optionsError.set(null);
      if (this.open()) {
        this.loadFirstPage();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Open / close
  // ---------------------------------------------------------------------

  openDropdown(): void {
    if (this.disabled()) {
      return;
    }
    this.inlineSaved.set(false);
    this.open.set(true);
    if (!this.items().length && !this.loading()) {
      this.loadFirstPage();
    }
  }

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.open()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  closeDropdown(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  // ---------------------------------------------------------------------
  // Search / paging
  // ---------------------------------------------------------------------

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.activeIndex.set(-1);
    this.inlineError.set(null);
    this.inlineSaved.set(false);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadFirstPage(), SEARCH_DEBOUNCE_MS);
  }

  retry(): void {
    this.loadFirstPage();
  }

  loadNextPage(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) {
      return;
    }
    const key = this.currentKey();
    const next = this.page() + 1;
    const seq = this.requestSeq;
    this.loadingMore.set(true);
    this.catalog
      .getOptions(this.typeCode(), this.queryParams(next))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (seq !== this.requestSeq || key !== this.currentKey()) {
            return;
          }
          const data = res?.data;
          if (data) {
            this.items.update((list) => [...list, ...(data.items ?? [])]);
            this.page.set(data.page ?? next);
            this.totalPages.set(data.total_pages ?? this.totalPages());
            this.totalItems.set(data.total_items ?? this.totalItems());
          }
          this.loadingMore.set(false);
        },
        error: (error: ApiErrorResponse) => {
          if (seq !== this.requestSeq || key !== this.currentKey()) {
            return;
          }
          this.optionsError.set(error?.code ? error : { code: 'INTERNAL_SERVER_ERROR' });
          this.loadingMore.set(false);
        }
      });
  }

  private loadFirstPage(): void {
    const typeCode = this.typeCode();
    if (!typeCode) {
      return;
    }
    const key = this.currentKey();
    const cached = this.pageCache.get(`${key}|0`);
    if (cached) {
      this.applyPage(cached);
      return;
    }

    const seq = ++this.requestSeq;
    this.loading.set(true);
    this.optionsError.set(null);
    this.catalog
      .getOptions(typeCode, this.queryParams(0))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (seq !== this.requestSeq || key !== this.currentKey()) {
            return;
          }
          const data = res?.data ?? EMPTY_PAGE;
          this.cachePage(key, data);
          this.applyPage(data);
        },
        error: (error: ApiErrorResponse) => {
          if (seq !== this.requestSeq || key !== this.currentKey()) {
            return;
          }
          this.items.set([]);
          this.totalPages.set(0);
          this.totalItems.set(0);
          this.optionsError.set(error?.code ? error : { code: 'INTERNAL_SERVER_ERROR' });
          this.loading.set(false);
        }
      });
  }

  private applyPage(data: PagedData<CatalogOptionItem>): void {
    this.items.set(data.items ?? []);
    this.page.set(data.page ?? 0);
    this.totalPages.set(data.total_pages ?? 0);
    this.totalItems.set(data.total_items ?? 0);
    this.activeIndex.set(-1);
    this.optionsError.set(null);
    this.loading.set(false);
  }

  private cachePage(key: string, data: PagedData<CatalogOptionItem>): void {
    if (this.pageCache.size >= PAGE_CACHE_LIMIT) {
      const oldest = this.pageCache.keys().next().value;
      if (oldest !== undefined) {
        this.pageCache.delete(oldest);
      }
    }
    this.pageCache.set(`${key}|0`, data);
  }

  private currentKey(): string {
    return [this.typeCode(), this.parentId() ?? '', this.asOf() ?? '', this.query().trim()].join('|');
  }

  private queryParams(page: number): CatalogLookupOptionsQuery {
    return {
      q: this.freeText() || undefined,
      parentId: this.parentId(),
      asOf: this.asOf(),
      page,
      size: OPTIONS_PAGE_SIZE
    };
  }

  // ---------------------------------------------------------------------
  // Keyboard / selection
  // ---------------------------------------------------------------------

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const onInput = event.target === this.searchInput()?.nativeElement;
    switch (event.key) {
      case 'ArrowDown':
        if (!onInput) {
          return;
        }
        event.preventDefault();
        if (this.open()) {
          this.move(1);
        } else {
          this.openDropdown();
        }
        break;
      case 'ArrowUp':
        if (!onInput) {
          return;
        }
        event.preventDefault();
        if (this.open()) {
          this.move(-1);
        }
        break;
      case 'Enter':
        if (!onInput || !this.open()) {
          return;
        }
        event.preventDefault();
        this.activateCurrent();
        break;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          event.stopPropagation();
          this.closeDropdown();
        }
        break;
      case 'Tab':
        this.closeDropdown();
        break;
      default:
        break;
    }
  }

  selectOption(item: CatalogOptionItem): void {
    this.codeById.set(item.id, item.code);
    const ref: CatalogItemRef = { catalog_item_id: item.id, text: item.name };
    if (this.multiple()) {
      if (this.selected().some((entry) => entry.catalog_item_id === item.id)) {
        return;
      }
      this.selected.update((list) => [...list, ref]);
      this.resetSearch();
    } else {
      this.selected.set([ref]);
      this.query.set('');
      this.items.set([]);
      this.closeDropdown();
    }
    this.emitSelection();
  }

  commitFreeText(): void {
    const text = this.freeText();
    if (!text) {
      return;
    }
    const ref: CatalogItemRef = { catalog_item_id: null, text };
    if (this.multiple()) {
      if (this.selected().some((entry) => entry.catalog_item_id === null && entry.text === text)) {
        return;
      }
      this.selected.update((list) => [...list, ref]);
      this.resetSearch();
    } else {
      this.selected.set([ref]);
      this.query.set('');
      this.items.set([]);
      this.closeDropdown();
    }
    this.freeTextChange.emit(text);
    this.emitSelection();
  }

  remove(ref: CatalogItemRef, event: Event): void {
    event.stopPropagation();
    this.selected.update((list) => list.filter((entry) => entry !== ref));
    if (!this.selected().some((entry) => entry.catalog_item_id === null)) {
      this.freeTextChange.emit(null);
    }
    this.emitSelection();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.selected.set([]);
    this.inlineSaved.set(false);
    this.freeTextChange.emit(null);
    this.emitSelection();
  }

  saveToCatalog(): void {
    const name = this.freeText();
    if (!name || this.inlineSaving()) {
      return;
    }
    this.inlineSaving.set(true);
    this.inlineError.set(null);
    this.inlineSaved.set(false);
    const payload: CatalogInlineCreateRequest = { name };
    this.catalog
      .inlineCreate(this.typeCode(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.inlineSaving.set(false);
          const item = res?.data;
          if (!item?.id) {
            this.inlineError.set({ code: 'INTERNAL_SERVER_ERROR' });
            return;
          }
          this.pageCache.clear();
          this.selectOption(item);
          this.inlineSaved.set(true);
        },
        error: (error: ApiErrorResponse) => {
          this.inlineSaving.set(false);
          this.inlineError.set(error?.code ? error : { code: 'INTERNAL_SERVER_ERROR' });
        }
      });
  }

  isSelected(item: CatalogOptionItem): boolean {
    return this.selected().some((entry) => entry.catalog_item_id === item.id);
  }

  titleFor(ref: CatalogItemRef): string {
    return ref.catalog_item_id ? this.codeById.get(ref.catalog_item_id) ?? ref.text : ref.text;
  }

  optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  private activateCurrent(): void {
    const index = this.activeIndex();
    if (index < 0) {
      return;
    }
    if (index < this.items().length) {
      this.selectOption(this.items()[index]);
    } else if (this.showFreeTextRow()) {
      this.commitFreeText();
    }
  }

  private move(step: number): void {
    const total = this.items().length + (this.showFreeTextRow() ? 1 : 0);
    if (!total) {
      return;
    }
    const index = this.activeIndex();
    const next = index < 0 ? (step > 0 ? 0 : total - 1) : (index + step + total) % total;
    this.activeIndex.set(next);
  }

  private resetSearch(): void {
    this.query.set('');
    this.activeIndex.set(-1);
    this.inlineError.set(null);
    this.loadFirstPage();
  }

  private emitSelection(): void {
    const list = this.selected();
    this.selectionChange.emit(this.multiple() ? list : list[0] ?? null);
  }
}
