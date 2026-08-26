var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, output, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffixPosition } from '../../enums/component.enum';
let AffixComponent = class AffixComponent {
    el;
    offsetTop = input(0);
    offsetBottom = input(0);
    position = input(AffixPosition.TOP);
    affixChange = output();
    isAffixed = signal(false);
    placeholderHeight = signal(0);
    width = signal(0);
    isTop = computed(() => {
        const p = String(this.position()).toLowerCase();
        return p === 'top';
    });
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
        this.placeholderHeight.set(rect.height);
        this.width.set(rect.width);
        let shouldAffix = false;
        if (this.isTop()) {
            shouldAffix = rect.top <= this.offsetTop();
        }
        else {
            shouldAffix = window.innerHeight - rect.bottom <= this.offsetBottom();
        }
        if (shouldAffix !== this.isAffixed()) {
            this.isAffixed.set(shouldAffix);
            this.affixChange.emit(shouldAffix);
        }
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div [style.height.px]="placeholderHeight()" [class.hidden]="!isAffixed()"></div>
    <div [class.fixed]="isAffixed()"
         [class.z-30]="isAffixed()"
         [style.top.px]="isAffixed() && isTop() ? offsetTop() : null"
         [style.bottom.px]="isAffixed() && !isTop() ? offsetBottom() : null"
         [style.width.px]="isAffixed() ? width() : null"
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