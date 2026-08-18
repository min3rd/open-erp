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
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
let StatisticComponent = class StatisticComponent {
    title = '';
    value = '';
    prefix;
    suffix;
    subText;
    icon;
    iconColor = 'text-indigo-600 dark:text-indigo-400';
    iconBg = 'bg-indigo-50 dark:bg-indigo-950/60';
    trend;
    trendValue;
    trendLabel;
    loading = false;
    bordered = true;
    get isTrendUp() {
        return String(this.trend) === 'up';
    }
    get isTrendDown() {
        return String(this.trend) === 'down';
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], StatisticComponent.prototype, "value", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "prefix", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "suffix", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "subText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "iconColor", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "iconBg", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "trend", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "trendValue", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StatisticComponent.prototype, "trendLabel", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], StatisticComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], StatisticComponent.prototype, "bordered", void 0);
StatisticComponent = __decorate([
    Component({
        selector: 'erp-statistic, erp-statistic-card',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './statistic.component.html',
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