var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffixPosition } from '../../enums/component.enum';
let AffixComponent = class AffixComponent {
    el;
    offsetTop = 0;
    offsetBottom = 0;
    position = AffixPosition.TOP;
    affixChange = new EventEmitter();
    isAffixed = false;
    placeholderHeight = 0;
    width = 0;
    constructor(el) {
        this.el = el;
    }
    ngOnInit() {
        this.checkAffix();
    }
    checkAffix() {
        if (typeof window === 'undefined')
            return;
        const rect = this.el.nativeElement.getBoundingClientRect();
        this.placeholderHeight = rect.height;
        this.width = rect.width;
        let shouldAffix = false;
        if (this.position === 'top') {
            shouldAffix = rect.top <= this.offsetTop;
        }
        else {
            shouldAffix = window.innerHeight - rect.bottom <= this.offsetBottom;
        }
        if (shouldAffix !== this.isAffixed) {
            this.isAffixed = shouldAffix;
            this.affixChange.emit(this.isAffixed);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Number)
], AffixComponent.prototype, "offsetTop", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], AffixComponent.prototype, "offsetBottom", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AffixComponent.prototype, "position", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], AffixComponent.prototype, "affixChange", void 0);
__decorate([
    HostListener('window:scroll'),
    HostListener('window:resize'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AffixComponent.prototype, "checkAffix", null);
AffixComponent = __decorate([
    Component({
        selector: 'erp-affix',
        standalone: true,
        imports: [CommonModule],
        template: `
    <div [style.height.px]="placeholderHeight" [class.hidden]="!isAffixed"></div>
    <div [class.fixed]="isAffixed"
         [class.z-30]="isAffixed"
         [style.top.px]="isAffixed && position === 'top' ? offsetTop : null"
         [style.bottom.px]="isAffixed && position === 'bottom' ? offsetBottom : null"
         [style.width.px]="isAffixed ? width : null"
         class="transition-all duration-200">
      <ng-content></ng-content>
    </div>
  `,
        styles: [`
    :host {
      display: block;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], AffixComponent);
export { AffixComponent };
//# sourceMappingURL=affix.component.js.map