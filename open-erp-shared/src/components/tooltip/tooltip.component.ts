import { Component, Input, Directive, ElementRef, HostListener, ViewContainerRef, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipPlacement } from '../../enums/component.enum';

@Component({
  selector: 'erp-tooltip-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="getPlacementClasses()"
         class="absolute z-50 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/95 dark:bg-slate-800 rounded-xl shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in duration-150 backdrop-blur-xs">
      {{ content }}
      <!-- Triangle Arrow -->
      <span [ngClass]="getArrowClasses()" class="absolute w-2 h-2 bg-slate-900/95 dark:bg-slate-800 rotate-45"></span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: absolute;
      pointer-events: none;
      z-index: 50;
    }
  `]
})
export class TooltipContainerComponent {
  @Input() content: string = '';
  @Input() placement: TooltipPlacement | 'top' | 'bottom' | 'left' | 'right' = TooltipPlacement.TOP;

  getPlacementClasses(): string {
    const p = String(this.placement);
    switch (p) {
      case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  }

  getArrowClasses(): string {
    const p = String(this.placement);
    switch (p) {
      case 'bottom': return '-top-1 left-1/2 -translate-x-1/2';
      case 'left': return '-right-1 top-1/2 -translate-y-1/2';
      case 'right': return '-left-1 top-1/2 -translate-y-1/2';
      case 'top':
      default: return '-bottom-1 left-1/2 -translate-x-1/2';
    }
  }
}

@Component({
  selector: 'erp-tooltip',
  standalone: true,
  imports: [CommonModule, TooltipContainerComponent],
  template: `
    <div (mouseenter)="show()" (mouseleave)="hide()" class="relative inline-block">
      <ng-content></ng-content>
      @if (visible && content) {
        <erp-tooltip-container [content]="content" [placement]="placement"></erp-tooltip-container>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class TooltipComponent {
  @Input() content: string = '';
  @Input() placement: TooltipPlacement | 'top' | 'bottom' | 'left' | 'right' = TooltipPlacement.TOP;
  visible: boolean = false;

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }
}
