var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, ElementRef, Output, EventEmitter, HostListener, Input } from '@angular/core';
let ClickOutsideDirective = class ClickOutsideDirective {
    elementRef;
    clickOutsideEnabled = true;
    clickOutside = new EventEmitter();
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    onDocumentClick(event) {
        if (!this.clickOutsideEnabled)
            return;
        const target = event.target;
        if (!this.elementRef.nativeElement.contains(target)) {
            this.clickOutside.emit(event);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ClickOutsideDirective.prototype, "clickOutsideEnabled", void 0);
__decorate([
    Output('erpClickOutside'),
    __metadata("design:type", Object)
], ClickOutsideDirective.prototype, "clickOutside", void 0);
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], ClickOutsideDirective.prototype, "onDocumentClick", null);
ClickOutsideDirective = __decorate([
    Directive({
        selector: '[erpClickOutside]',
        standalone: true
    }),
    __metadata("design:paramtypes", [ElementRef])
], ClickOutsideDirective);
export { ClickOutsideDirective };
//# sourceMappingURL=click-outside.directive.js.map