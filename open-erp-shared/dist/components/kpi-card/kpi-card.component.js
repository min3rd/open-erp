var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { KpiTrendDirection } from '../../enums/component.enum';
const TREND_CLASSES = {
    [KpiTrendDirection.UP]: 'text-emerald-600 dark:text-emerald-400',
    [KpiTrendDirection.DOWN]: 'text-rose-600 dark:text-rose-400',
    [KpiTrendDirection.NEUTRAL]: 'text-slate-500 dark:text-slate-400'
};
const TREND_ICONS = {
    [KpiTrendDirection.UP]: 'trending-up',
    [KpiTrendDirection.DOWN]: 'trending-down',
    [KpiTrendDirection.NEUTRAL]: 'activity'
};
let KpiCardComponent = class KpiCardComponent {
    title = input('');
    value = input('');
    subText = input('');
    trend = input(KpiTrendDirection.NEUTRAL);
    iconName = input(undefined);
    iconBg = input('bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400');
    loading = input(false);
    trendClass = computed(() => {
        const tr = String(this.trend());
        return TREND_CLASSES[tr] || TREND_CLASSES[KpiTrendDirection.NEUTRAL];
    });
    trendIcon = computed(() => {
        const tr = String(this.trend());
        return TREND_ICONS[tr] || 'activity';
    });
};
KpiCardComponent = __decorate([
    Component({
        selector: 'erp-kpi-card',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './kpi-card.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], KpiCardComponent);
export { KpiCardComponent };
//# sourceMappingURL=kpi-card.component.js.map