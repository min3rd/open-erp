var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, output, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { BackToTopShape } from '../../../enums/component.enum';
let BackToTopComponent = class BackToTopComponent {
    threshold = input(300);
    shape = input(BackToTopShape.CIRCLE);
    showProgress = input(true);
    icon = input('arrow-up');
    text = input(undefined);
    tooltip = input('Lên đầu trang');
    targetSelector = input(undefined);
    right = input('2rem');
    bottom = input('2rem');
    scrollClick = output();
    visible = signal(false);
    scrollProgress = signal(0);
    isCircle = computed(() => String(this.shape()) === 'circle');
    isRounded = computed(() => String(this.shape()) === 'rounded');
    isPill = computed(() => String(this.shape()) === 'pill');
    ngOnInit() {
        this.updateScrollState();
    }
    onWindowScroll() {
        this.updateScrollState();
    }
    scrollToTop() {
        this.scrollClick.emit();
        const sel = this.targetSelector();
        if (sel && typeof document !== 'undefined') {
            const container = document.querySelector(sel);
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
        const sel = this.targetSelector();
        if (sel) {
            const container = document.querySelector(sel);
            if (container) {
                scrollTop = container.scrollTop;
                docHeight = container.scrollHeight - container.clientHeight;
            }
        }
        this.visible.set(scrollTop > this.threshold());
        this.scrollProgress.set(docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0);
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
    }
  `]
    })
], BackToTopComponent);
export { BackToTopComponent };
//# sourceMappingURL=back-to-top.component.js.map