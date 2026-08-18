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
let AnchorComponent = class AnchorComponent {
    items = [];
    activeTargetId = '';
    offsetTop = 100;
    showRail = true;
    title = 'Nội dung trang';
    anchorClick = new EventEmitter();
    activeTargetIdChange = new EventEmitter();
    ngOnInit() {
        if (!this.activeTargetId && this.items.length > 0) {
            this.activeTargetId = this.items[0].targetId;
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
        this.activeTargetId = item.targetId;
        this.activeTargetIdChange.emit(this.activeTargetId);
        this.anchorClick.emit(item);
        if (typeof document !== 'undefined') {
            const el = document.getElementById(item.targetId);
            if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - this.offsetTop;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    }
    checkActiveSection() {
        if (typeof document === 'undefined' || this.items.length === 0)
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
        collectTargets(this.items);
        let current = this.activeTargetId;
        for (const id of allTargets) {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= this.offsetTop + 40 && rect.bottom > this.offsetTop) {
                    current = id;
                    break;
                }
            }
        }
        if (current && current !== this.activeTargetId) {
            this.activeTargetId = current;
            this.activeTargetIdChange.emit(this.activeTargetId);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], AnchorComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AnchorComponent.prototype, "activeTargetId", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], AnchorComponent.prototype, "offsetTop", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AnchorComponent.prototype, "showRail", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AnchorComponent.prototype, "title", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], AnchorComponent.prototype, "anchorClick", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], AnchorComponent.prototype, "activeTargetIdChange", void 0);
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
        styles: [`
    :host {
      display: block;
    }
  `]
    })
], AnchorComponent);
export { AnchorComponent };
//# sourceMappingURL=anchor.component.js.map