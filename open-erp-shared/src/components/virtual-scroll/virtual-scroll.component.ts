import { Component, Input, ContentChild, TemplateRef, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-virtual-scroll, erp-virtual-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #scrollContainer
         (scroll)="onScroll()"
         [style.height]="height"
         class="overflow-y-auto relative custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
      
      <!-- Total Virtual Canvas Height -->
      <div [style.height.px]="totalHeight" class="relative w-full">
        
        <!-- Rendered Sliced Items Viewport -->
        <div [style.transform]="'translateY(' + offsetY + 'px)'" class="absolute top-0 left-0 right-0">
          @for (item of visibleItems; track $index) {
            <div [style.height.px]="itemSize" class="box-border">
              <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item, index: startIndex + $index }"></ng-container>
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
  @Input() items: T[] = [];
  @Input() itemSize: number = 48; // px height per row
  @Input() height: string = '360px'; // container height
  @Input() buffer: number = 5; // buffer items above and below

  @ContentChild(TemplateRef) itemTemplate?: any;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  startIndex: number = 0;
  endIndex: number = 20;
  offsetY: number = 0;

  get totalHeight(): number {
    return this.items.length * this.itemSize;
  }

  get visibleItems(): T[] {
    return this.items.slice(this.startIndex, this.endIndex);
  }

  onScroll(): void {
    if (!this.scrollContainer) return;
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;
    const viewportHeight = this.scrollContainer.nativeElement.clientHeight;

    const start = Math.floor(scrollTop / this.itemSize);
    const visibleCount = Math.ceil(viewportHeight / this.itemSize);

    this.startIndex = Math.max(0, start - this.buffer);
    this.endIndex = Math.min(this.items.length, start + visibleCount + this.buffer);
    this.offsetY = this.startIndex * this.itemSize;
  }
}
