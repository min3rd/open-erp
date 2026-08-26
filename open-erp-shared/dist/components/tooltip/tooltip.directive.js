var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, ElementRef, HostListener, input, Renderer2 } from '@angular/core';
import { TooltipPlacement } from '../../enums/component.enum';
let TooltipDirective = class TooltipDirective {
    el;
    renderer;
    text = input('', { alias: 'erpTooltip' });
    tooltipPlacement = input(TooltipPlacement.TOP);
    tooltipEl;
    constructor(el, renderer) {
        this.el = el;
        this.renderer = renderer;
    }
    onMouseEnter() {
        const val = this.text();
        if (!val)
            return;
        this.createTooltip(val);
    }
    onMouseLeave() {
        this.destroyTooltip();
    }
    createTooltip(textContent) {
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
    destroyTooltip() {
        if (this.tooltipEl && this.tooltipEl.parentNode) {
            this.renderer.removeChild(this.tooltipEl.parentNode, this.tooltipEl);
            this.tooltipEl = undefined;
        }
    }
};
__decorate([
    HostListener('mouseenter'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TooltipDirective.prototype, "onMouseEnter", null);
__decorate([
    HostListener('mouseleave'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TooltipDirective.prototype, "onMouseLeave", null);
TooltipDirective = __decorate([
    Directive({
        selector: '[erpTooltip]',
        standalone: true
    }),
    __metadata("design:paramtypes", [ElementRef, Renderer2])
], TooltipDirective);
export { TooltipDirective };
//# sourceMappingURL=tooltip.directive.js.map