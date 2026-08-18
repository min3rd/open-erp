import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { PopoverPlacement, PopoverTrigger } from '../../enums/component.enum';

@Component({
  selector: 'erp-popover',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative inline-block">
      <!-- Trigger Content -->
      <div (click)="onTriggerClick()" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()" class="inline-block cursor-pointer">
        <ng-content select="[popover-trigger]"></ng-content>
      </div>

      <!-- Popover Floating Box -->
      @if (isOpen) {
        <div [class]="placementClasses"
             [style.width]="width"
             (mouseenter)="onMouseEnter()"
             (mouseleave)="onMouseLeave()"
             class="absolute z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-xs text-slate-700 dark:text-slate-200 transition-all duration-200 animate-in fade-in zoom-in-95 min-w-56">
          
          <!-- Popover Title -->
          @if (title) {
            <div class="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2">
              {{ title }}
            </div>
          }

          <!-- Popover Body -->
          <div class="leading-relaxed">
            @if (content) {
              <p>{{ content }}</p>
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
  @Input() title?: string;
  @Input() content?: string;
  @Input() placement: PopoverPlacement | 'top' | 'bottom' | 'left' | 'right' = PopoverPlacement.TOP;
  @Input() trigger: PopoverTrigger | 'click' | 'hover' = PopoverTrigger.CLICK;
  @Input() width?: string;

  isOpen: boolean = false;
  private hoverTimeout: any;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  get placementClasses(): string {
    switch (this.placement) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  }

  onTriggerClick(): void {
    if (this.trigger === 'click') {
      this.isOpen = !this.isOpen;
    }
  }

  onMouseEnter(): void {
    if (this.trigger === 'hover') {
      clearTimeout(this.hoverTimeout);
      this.isOpen = true;
    }
  }

  onMouseLeave(): void {
    if (this.trigger === 'hover') {
      this.hoverTimeout = setTimeout(() => {
        this.isOpen = false;
      }, 150);
    }
  }
}
