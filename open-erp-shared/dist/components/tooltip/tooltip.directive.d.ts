import { ElementRef, Renderer2 } from '@angular/core';
import { TooltipPlacement } from '../../enums/component.enum';
export declare class TooltipDirective {
    private el;
    private renderer;
    readonly text: import("@angular/core").InputSignal<string>;
    readonly tooltipPlacement: import("@angular/core").InputSignal<"left" | "right" | "top" | "bottom" | TooltipPlacement>;
    private tooltipEl?;
    constructor(el: ElementRef, renderer: Renderer2);
    onMouseEnter(): void;
    onMouseLeave(): void;
    private createTooltip;
    private destroyTooltip;
}
