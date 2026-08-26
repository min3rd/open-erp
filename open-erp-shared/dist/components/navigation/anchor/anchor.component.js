var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, model, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
let AnchorComponent = class AnchorComponent {
    items = input([]);
    activeTargetId = model('');
    offsetTop = input(100);
    showRail = input(true);
    title = input('Nội dung trang');
    anchorClick = output();
    ngOnInit() {
        const act = this.activeTargetId();
        const its = this.items();
        if (!act && its.length > 0) {
            this.activeTargetId.set(its[0].targetId);
        }
    }
    ngAfterViewInit() {
        this.checkActiveSection();
    }
    onWindowScroll() {
        this.checkActiveSection();
    }
    scrollToTarget(item, event) {
        event.preventDefault();
        this.activeTargetId.set(item.targetId);
        this.anchorClick.emit(item);
        if (typeof document !== 'undefined') {
            const el = document.getElementById(item.targetId);
            if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - this.offsetTop();
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    }
    checkActiveSection() {
        const its = this.items();
        if (typeof document === 'undefined' || its.length === 0)
            return;
        const allTargets = [];
        const collectTargets = (list) => {
            for (const item of list) {
                if (item.targetId)
                    allTargets.push(item.targetId);
                if (item.children)
                    collectTargets(item.children);
            }
        };
        collectTargets(its);
        let current = this.activeTargetId();
        const offset = this.offsetTop();
        for (const id of allTargets) {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= offset + 40 && rect.bottom > offset) {
                    current = id;
                    break;
                }
            }
        }
        if (current && current !== this.activeTargetId()) {
            this.activeTargetId.set(current);
        }
    }
};
__decorate([
    HostListener('window:scroll', []),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnchorComponent.prototype, "onWindowScroll", null);
AnchorComponent = __decorate([
    Component({
        selector: 'erp-anchor, erp-scrollspy',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './anchor.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
    }
  `]
    })
], AnchorComponent);
export { AnchorComponent };
//# sourceMappingURL=anchor.component.js.map