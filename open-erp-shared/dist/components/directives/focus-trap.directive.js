var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, ElementRef, HostListener, Input } from '@angular/core';
let FocusTrapDirective = class FocusTrapDirective {
    el;
    enabled = true;
    focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    constructor(el) {
        this.el = el;
    }
    ngAfterViewInit() {
        if (this.enabled) {
            this.focusFirstElement();
        }
    }
    onKeyDown(event) {
        if (!this.enabled || event.key !== 'Tab')
            return;
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length === 0)
            return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        }
        else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }
    getFocusableElements() {
        return Array.from(this.el.nativeElement.querySelectorAll(this.focusableSelector));
    }
    focusFirstElement() {
        const focusable = this.getFocusableElements();
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }
};
__decorate([
    Input('erpFocusTrap'),
    __metadata("design:type", Boolean)
], FocusTrapDirective.prototype, "enabled", void 0);
__decorate([
    HostListener('keydown', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeyboardEvent]),
    __metadata("design:returntype", void 0)
], FocusTrapDirective.prototype, "onKeyDown", null);
FocusTrapDirective = __decorate([
    Directive({
        selector: '[erpFocusTrap]',
        standalone: true
    }),
    __metadata("design:paramtypes", [ElementRef])
], FocusTrapDirective);
export { FocusTrapDirective };
//# sourceMappingURL=focus-trap.directive.js.map