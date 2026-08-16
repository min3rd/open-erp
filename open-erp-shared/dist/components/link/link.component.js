var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
let LinkComponent = class LinkComponent {
    href;
    routerLink;
    external = false;
    underline = 'hover';
    color = 'primary';
    iconLeft;
    iconRight;
    disabled = false;
    loading = false;
    getColorClasses() {
        switch (this.color) {
            case 'muted':
                return 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200';
            case 'danger':
                return 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300';
            case 'slate':
                return 'text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400';
            case 'primary':
            default:
                return 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold';
        }
    }
    getUnderlineClasses() {
        switch (this.underline) {
            case 'always':
                return 'underline underline-offset-2';
            case 'hover':
                return 'hover:underline underline-offset-2';
            case 'none':
            default:
                return 'no-underline';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], LinkComponent.prototype, "href", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], LinkComponent.prototype, "routerLink", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], LinkComponent.prototype, "external", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], LinkComponent.prototype, "underline", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], LinkComponent.prototype, "color", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], LinkComponent.prototype, "iconLeft", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], LinkComponent.prototype, "iconRight", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], LinkComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], LinkComponent.prototype, "loading", void 0);
LinkComponent = __decorate([
    Component({
        selector: 'erp-link',
        standalone: true,
        imports: [CommonModule, RouterModule, IconComponent, SkeletonComponent],
        templateUrl: './link.component.html'
    })
], LinkComponent);
export { LinkComponent };
//# sourceMappingURL=link.component.js.map