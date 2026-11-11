import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  afterNextRender,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { IconComponent } from '../icon/icon.component';

export interface FilterItem<T = string> {
  id: T;
  labelKey?: string;
  label?: string;
  count?: number;
  icon?: string;
  disabled?: boolean;
  testId?: string;
}

export type FilterStripSize = 'xs' | 'sm' | 'md';
export type FilterStripVariant = 'sharp' | 'pill';

/**
 * Compact, single-line horizontal scrollable filter strip component.
 * Allows smooth horizontal scrolling via touch, mouse wheel or navigation buttons.
 * Guarantees high-density ERP layout without wrapping buttons into multiple lines.
 */
@Component({
  selector: 'app-filter-strip',
  standalone: true,
  imports: [CommonModule, TranslatePipe, IconComponent],
  templateUrl: './filter-strip.component.html',
})
export class FilterStripComponent<T = string> {
  @ViewChild('scrollContainer')
  scrollContainerRef?: ElementRef<HTMLDivElement>;

  items = input.required<ReadonlyArray<FilterItem<T>>>();
  selectedId = input.required<T>();
  selectedChange = output<T>();

  ariaLabel = input<string>('Filter options');
  ariaLabelKey = input<string>('');
  scrollLeftLabelKey = input<string>('COMMON_PREV');
  scrollRightLabelKey = input<string>('COMMON_NEXT_PAGE');
  size = input<FilterStripSize>('sm');
  variant = input<FilterStripVariant>('sharp');
  showCount = input<boolean>(true);

  readonly canScrollLeft = signal<boolean>(false);
  readonly canScrollRight = signal<boolean>(false);

  constructor() {
    afterNextRender(() => {
      this.updateScrollState();
    });
  }

  select(id: T): void {
    if (id !== this.selectedId()) {
      this.selectedChange.emit(id);
    }
  }

  scrollLeft(): void {
    const el = this.scrollContainerRef?.nativeElement;
    if (el) {
      el.scrollBy({ left: -180, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    const el = this.scrollContainerRef?.nativeElement;
    if (el) {
      el.scrollBy({ left: 180, behavior: 'smooth' });
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    const el = this.scrollContainerRef?.nativeElement;
    if (el && el.scrollWidth > el.clientWidth && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      el.scrollLeft += event.deltaY;
      this.updateScrollState();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateScrollState();
  }

  updateScrollState(): void {
    const el = this.scrollContainerRef?.nativeElement;
    if (!el) return;
    this.canScrollLeft.set(el.scrollLeft > 4);
    this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const list = this.items();
    if (list.length === 0) return;

    let next = index;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % list.length;
        break;
      case 'ArrowLeft':
        next = (index - 1 + list.length) % list.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = list.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(list[next].id);
    const target = document.getElementById(`filter-item-${list[next].id}`);
    target?.focus();
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  getButtonClasses(isSelected: boolean): string {
    const sizeCls =
      this.size() === 'xs'
        ? 'px-2 py-0.5 text-[10px] min-h-[24px]'
        : this.size() === 'md'
          ? 'px-3 py-1.5 text-xs min-h-[32px]'
          : 'px-2.5 py-1 text-xs min-h-[28px]';

    const shapeCls = this.variant() === 'pill' ? 'rounded-sm' : 'rounded-none';

    if (isSelected) {
      return `${sizeCls} ${shapeCls} bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 font-bold shadow-xs`;
    }

    return `${sizeCls} ${shapeCls} bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium`;
  }
}
