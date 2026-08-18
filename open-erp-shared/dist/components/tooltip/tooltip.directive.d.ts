import { ElementRef, Renderer2 } from '@angular/core';
import { TooltipPlacement } from '../../enums/component.enum';
export declare class TooltipDirective {
    private el;
    private renderer;
    text: string;
    tooltipPlacement: TooltipPlacement | 'top' | 'bottom' | 'left' | 'right';
    private tooltipEl?;
    constructor(el: ElementRef, renderer: Renderer2);
    onMouseEnter(): void;
    onMouseLeave(): void;
    private createTooltip;
    private destroyTooltip;
}
