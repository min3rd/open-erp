import { Component, ChangeDetectionStrategy, input, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverPlacement, PopoverTrigger } from '../../enums/component.enum';

const PLACEMENT_CLASSES: Record<string, string> = {
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
};

@Component({
  selector: 'erp-popover',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block">
      <!-- Trigger Content -->
      <div
        (click)="onTriggerClick()"
        (mouseenter)="onMouseEnter()"
        (mouseleave)="onMouseLeave()"
        class="inline-block cursor-pointer"
      >
        <ng-content select="[popover-trigger]"></ng-content>
      </div>

      <!-- Popover Floating Box -->
      @if (isOpen()) {
        <div
          [class]="placementClasses()"
          [style.width]="width()"
          (mouseenter)="onMouseEnter()"
          (mouseleave)="onMouseLeave()"
          class="absolute z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-xs text-slate-700 dark:text-slate-200 transition-all duration-200 animate-in fade-in zoom-in-95 min-w-56"
        >
          <!-- Popover Title -->
          @if (title()) {
            <div
              class="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2"
            >
              {{ title() }}
            </div>
          }

          <!-- Popover Body -->
          <div class="leading-relaxed">
            @if (content()) {
              <p>{{ content() }}</p>
            }
            <ng-content></ng-content>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
  `]
})
export class PopoverComponent {
  readonly title = input<string | undefined>(undefined);
  readonly content = input<string | undefined>(undefined);
  readonly placement = input<PopoverPlacement | 'top' | 'bottom' | 'left' | 'right'>(PopoverPlacement.TOP);
  readonly trigger = input<PopoverTrigger | 'click' | 'hover'>(PopoverTrigger.CLICK);
  readonly width = input<string | undefined>(undefined);

  isOpen = signal<boolean>(false);
  private hoverTimeout: any;

  constructor(private elementRef: ElementRef) {}

  readonly placementClasses = computed(() => {
    const p = String(this.placement());
    return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES['top'];
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  onTriggerClick(): void {
    if (this.trigger() === 'click' || String(this.trigger()) === PopoverTrigger.CLICK) {
      this.isOpen.update(v => !v);
    }
  }

  onMouseEnter(): void {
    if (this.trigger() === 'hover' || String(this.trigger()) === PopoverTrigger.HOVER) {
      clearTimeout(this.hoverTimeout);
      this.isOpen.set(true);
    }
  }

  onMouseLeave(): void {
    if (this.trigger() === 'hover' || String(this.trigger()) === PopoverTrigger.HOVER) {
      this.hoverTimeout = setTimeout(() => {
        this.isOpen.set(false);
      }, 150);
    }
  }
}
