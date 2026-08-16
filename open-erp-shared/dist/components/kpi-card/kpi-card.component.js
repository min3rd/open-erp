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
import { KpiTrendDirection } from '../../enums/component.enum';
let KpiCardComponent = class KpiCardComponent {
    title = '';
    value = '';
    subText = '';
    trend = KpiTrendDirection.NEUTRAL;
    iconName;
    iconBg = 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400';
    loading = false;
    getTrendClasses() {
        const tr = String(this.trend);
        switch (tr) {
            case KpiTrendDirection.UP:
            case 'up':
                return 'text-emerald-600 dark:text-emerald-400';
            case KpiTrendDirection.DOWN:
            case 'down':
                return 'text-rose-600 dark:text-rose-400';
            case KpiTrendDirection.NEUTRAL:
            case 'neutral':
            default:
                return 'text-slate-500 dark:text-slate-400';
        }
    }
    getTrendIcon() {
        const tr = String(this.trend);
        if (tr === KpiTrendDirection.UP || tr === 'up')
            return 'trending-up';
        if (tr === KpiTrendDirection.DOWN || tr === 'down')
            return 'trending-down';
        return 'activity';
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], KpiCardComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], KpiCardComponent.prototype, "value", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], KpiCardComponent.prototype, "subText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], KpiCardComponent.prototype, "trend", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], KpiCardComponent.prototype, "iconName", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], KpiCardComponent.prototype, "iconBg", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], KpiCardComponent.prototype, "loading", void 0);
KpiCardComponent = __decorate([
    Component({
        selector: 'erp-kpi-card',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './kpi-card.component.html'
    })
], KpiCardComponent);
export { KpiCardComponent };
//# sourceMappingURL=kpi-card.component.js.map