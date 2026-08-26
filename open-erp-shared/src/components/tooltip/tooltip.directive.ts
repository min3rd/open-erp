import { Directive, ElementRef, HostListener, input, Renderer2 } from '@angular/core';
import { TooltipPlacement } from '../../enums/component.enum';

@Directive({
  selector: '[erpTooltip]',
  standalone: true
})
export class TooltipDirective {
  readonly text = input<string>('', { alias: 'erpTooltip' });
  readonly tooltipPlacement = input<TooltipPlacement | 'top' | 'bottom' | 'left' | 'right'>(TooltipPlacement.TOP);

  private tooltipEl?: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    const val = this.text();
    if (!val) return;
    this.createTooltip(val);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.destroyTooltip();
  }

  private createTooltip(textContent: string): void {
    this.destroyTooltip();

    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltip = this.renderer.createElement('div');
    this.renderer.setProperty(tooltip, 'textContent', textContent);

    // Apply styles
    this.renderer.addClass(tooltip, 'fixed');
    this.renderer.addClass(tooltip, 'z-50');
    this.renderer.addClass(tooltip, 'px-2.5');
    this.renderer.addClass(tooltip, 'py-1');
    this.renderer.addClass(tooltip, 'text-[11px]');
    this.renderer.addClass(tooltip, 'font-semibold');
    this.renderer.addClass(tooltip, 'text-white');
    this.renderer.addClass(tooltip, 'bg-slate-900');
    this.renderer.addClass(tooltip, 'rounded-xl');
    this.renderer.addClass(tooltip, 'shadow-lg');
    this.renderer.addClass(tooltip, 'pointer-events-none');
    this.renderer.addClass(tooltip, 'animate-in');
    this.renderer.addClass(tooltip, 'fade-in');

    this.renderer.appendChild(document.body, tooltip);
    this.tooltipEl = tooltip;

    // Position
    const tooltipPos = tooltip.getBoundingClientRect();
    let top = 0;
    let left = 0;

    const p = String(this.tooltipPlacement());
    switch (p) {
      case 'bottom':
        top = hostPos.bottom + 6;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'left':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.left - tooltipPos.width - 6;
        break;
      case 'right':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.right + 6;
        break;
      case 'top':
      default:
        top = hostPos.top - tooltipPos.height - 6;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
    }

    this.renderer.setStyle(tooltip, 'top', `${top}px`);
    this.renderer.setStyle(tooltip, 'left', `${left}px`);
  }

  private destroyTooltip(): void {
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.renderer.removeChild(this.tooltipEl.parentNode, this.tooltipEl);
      this.tooltipEl = undefined;
    }
  }
}
