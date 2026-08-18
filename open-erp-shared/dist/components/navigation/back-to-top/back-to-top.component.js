var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { BackToTopShape } from '../../../enums/component.enum';
let BackToTopComponent = class BackToTopComponent {
    threshold = 300;
    shape = BackToTopShape.CIRCLE;
    showProgress = true;
    icon = 'arrow-up';
    text;
    tooltip = 'Lên đầu trang';
    targetSelector;
    right = '2rem';
    bottom = '2rem';
    scrollClick = new EventEmitter();
    visible = false;
    scrollProgress = 0; // 0 to 100
    get isCircle() {
        return String(this.shape) === 'circle';
    }
    get isRounded() {
        return String(this.shape) === 'rounded';
    }
    get isPill() {
        return String(this.shape) === 'pill';
    }
    ngOnInit() {
        this.updateScrollState();
    }
    onWindowScroll() {
        this.updateScrollState();
    }
    scrollToTop() {
        this.scrollClick.emit();
        if (this.targetSelector && typeof document !== 'undefined') {
            const container = document.querySelector(this.targetSelector);
            if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    updateScrollState() {
        if (typeof window === 'undefined' || typeof document === 'undefined')
            return;
        let scrollTop = window.scrollY;
        let docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (this.targetSelector) {
            const container = document.querySelector(this.targetSelector);
            if (container) {
                scrollTop = container.scrollTop;
                docHeight = container.scrollHeight - container.clientHeight;
            }
        }
        this.visible = scrollTop > this.threshold;
        this.scrollProgress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    }
};
__decorate([
    Input(),
    __metadata("design:type", Number)
], BackToTopComponent.prototype, "threshold", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BackToTopComponent.prototype, "shape", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BackToTopComponent.prototype, "showProgress", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BackToTopComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BackToTopComponent.prototype, "text", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BackToTopComponent.prototype, "tooltip", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BackToTopComponent.prototype, "targetSelector", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BackToTopComponent.prototype, "right", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BackToTopComponent.prototype, "bottom", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BackToTopComponent.prototype, "scrollClick", void 0);
__decorate([
    HostListener('window:scroll', []),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BackToTopComponent.prototype, "onWindowScroll", null);
BackToTopComponent = __decorate([
    Component({
        selector: 'erp-back-to-top',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './back-to-top.component.html',
        styles: [`
    :host {
      display: block;
    }
  `]
    })
], BackToTopComponent);
export { BackToTopComponent };
//# sourceMappingURL=back-to-top.component.js.map