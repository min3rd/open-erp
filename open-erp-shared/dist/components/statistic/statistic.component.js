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
let StatisticComponent = class StatisticComponent {
    title = input('');
    value = input('');
    prefix = input(undefined);
    suffix = input(undefined);
    subText = input(undefined);
    icon = input(undefined);
    iconColor = input('text-indigo-600 dark:text-indigo-400');
    iconBg = input('bg-indigo-50 dark:bg-indigo-950/60');
    trend = input(undefined);
    trendValue = input(undefined);
    trendLabel = input(undefined);
    loading = input(false);
    bordered = input(true);
    isTrendUp = computed(() => String(this.trend()) === 'up');
    isTrendDown = computed(() => String(this.trend()) === 'down');
};
StatisticComponent = __decorate([
    Component({
        selector: 'erp-statistic, erp-statistic-card',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './statistic.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], StatisticComponent);
export { StatisticComponent };
//# sourceMappingURL=statistic.component.js.map