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
import { BadgeStatus } from '../../enums/component.enum';
import { SkeletonComponent } from '../skeleton/skeleton.component';
let StatusBadgeComponent = class StatusBadgeComponent {
    status = BadgeStatus.PENDING;
    label = '';
    showDot = true;
    loading = false;
    get normalizedStatus() {
        return (this.status || '').toUpperCase();
    }
    getBadgeClasses() {
        switch (this.normalizedStatus) {
            case BadgeStatus.COMPLETED:
            case BadgeStatus.ACTIVE:
            case BadgeStatus.SUCCESS:
                return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50';
            case BadgeStatus.PROCESSING:
            case BadgeStatus.INFO:
                return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50';
            case BadgeStatus.PENDING:
            case BadgeStatus.WARNING:
            case BadgeStatus.DRAFT:
                return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50';
            case BadgeStatus.INACTIVE:
            case BadgeStatus.DANGER:
            case BadgeStatus.CANCELLED:
                return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        }
    }
    getDotClasses() {
        switch (this.normalizedStatus) {
            case BadgeStatus.COMPLETED:
            case BadgeStatus.ACTIVE:
            case BadgeStatus.SUCCESS:
                return 'bg-emerald-500 animate-pulse';
            case BadgeStatus.PROCESSING:
            case BadgeStatus.INFO:
                return 'bg-indigo-500 animate-pulse';
            case BadgeStatus.PENDING:
            case BadgeStatus.WARNING:
            case BadgeStatus.DRAFT:
                return 'bg-amber-500';
            case BadgeStatus.INACTIVE:
            case BadgeStatus.DANGER:
            case BadgeStatus.CANCELLED:
                return 'bg-rose-500';
            default:
                return 'bg-slate-400';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], StatusBadgeComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatusBadgeComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], StatusBadgeComponent.prototype, "showDot", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], StatusBadgeComponent.prototype, "loading", void 0);
StatusBadgeComponent = __decorate([
    Component({
        selector: 'erp-status-badge',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './status-badge.component.html'
    })
], StatusBadgeComponent);
export { StatusBadgeComponent };
//# sourceMappingURL=status-badge.component.js.map