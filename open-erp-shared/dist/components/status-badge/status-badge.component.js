var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeStatus } from '../../enums/component.enum';
import { SkeletonComponent } from '../skeleton/skeleton.component';
const BADGE_CLASSES = {
    [BadgeStatus.COMPLETED]: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
    [BadgeStatus.ACTIVE]: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
    [BadgeStatus.SUCCESS]: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
    [BadgeStatus.PROCESSING]: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50',
    [BadgeStatus.INFO]: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50',
    [BadgeStatus.PENDING]: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
    [BadgeStatus.WARNING]: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
    [BadgeStatus.DRAFT]: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
    [BadgeStatus.INACTIVE]: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50',
    [BadgeStatus.DANGER]: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50',
    [BadgeStatus.CANCELLED]: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50'
};
const DOT_CLASSES = {
    [BadgeStatus.COMPLETED]: 'bg-emerald-500 animate-pulse',
    [BadgeStatus.ACTIVE]: 'bg-emerald-500 animate-pulse',
    [BadgeStatus.SUCCESS]: 'bg-emerald-500 animate-pulse',
    [BadgeStatus.PROCESSING]: 'bg-indigo-500 animate-pulse',
    [BadgeStatus.INFO]: 'bg-indigo-500 animate-pulse',
    [BadgeStatus.PENDING]: 'bg-amber-500',
    [BadgeStatus.WARNING]: 'bg-amber-500',
    [BadgeStatus.DRAFT]: 'bg-amber-500',
    [BadgeStatus.INACTIVE]: 'bg-rose-500',
    [BadgeStatus.DANGER]: 'bg-rose-500',
    [BadgeStatus.CANCELLED]: 'bg-rose-500'
};
let StatusBadgeComponent = class StatusBadgeComponent {
    status = input(BadgeStatus.PENDING);
    label = input('');
    showDot = input(true);
    loading = input(false);
    normalizedStatus = computed(() => {
        return String(this.status() || '').toUpperCase();
    });
    badgeClasses = computed(() => {
        const st = this.normalizedStatus();
        return BADGE_CLASSES[st] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    });
    dotClasses = computed(() => {
        const st = this.normalizedStatus();
        return DOT_CLASSES[st] || 'bg-slate-400';
    });
    displayLabel = computed(() => {
        const l = this.label();
        if (l)
            return l;
        return this.status();
    });
};
StatusBadgeComponent = __decorate([
    Component({
        selector: 'erp-status-badge',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './status-badge.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], StatusBadgeComponent);
export { StatusBadgeComponent };
//# sourceMappingURL=status-badge.component.js.map