import { Component, ChangeDetectionStrategy, input, ContentChild, TemplateRef, ElementRef, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-virtual-scroll, erp-virtual-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #scrollContainer
         (scroll)="onScroll()"
         [style.height]="height()"
         class="overflow-y-auto relative custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
      
      <!-- Total Virtual Canvas Height -->
      <div [style.height.px]="totalHeight()" class="relative w-full">
        
        <!-- Rendered Sliced Items Viewport -->
        <div [style.transform]="'translateY(' + offsetY() + 'px)'" class="absolute top-0 left-0 right-0">
          @for (item of visibleItems(); track $index) {
            <div [style.height.px]="itemSize()" class="box-border">
              <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item, index: startIndex() + $index }"></ng-container>
            </div>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class VirtualScrollComponent<T = any> {
  readonly items = input<T[]>([]);
  readonly itemSize = input<number>(48);
  readonly height = input<string>('360px');
  readonly buffer = input<number>(5);

  @ContentChild(TemplateRef) itemTemplate?: any;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  startIndex = signal<number>(0);
  endIndex = signal<number>(20);
  offsetY = signal<number>(0);

  readonly totalHeight = computed(() => {
    return this.items().length * this.itemSize();
  });

  readonly visibleItems = computed<T[]>(() => {
    return this.items().slice(this.startIndex(), this.endIndex());
  });

  onScroll(): void {
    if (!this.scrollContainer) return;
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    const viewportHeight = this.scrollContainer.nativeElement.clientHeight;
    const size = this.itemSize();
    const buf = this.buffer();

    const start = Math.floor(scrollTop / size);
    const visibleCount = Math.ceil(viewportHeight / size);

    const sIdx = Math.max(0, start - buf);
    const eIdx = Math.min(this.items().length, start + visibleCount + buf);

    this.startIndex.set(sIdx);
    this.endIndex.set(eIdx);
    this.offsetY.set(sIdx * size);
  }
}
