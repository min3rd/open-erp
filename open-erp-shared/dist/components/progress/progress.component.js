var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ProgressVariant, ProgressStatus } from '../../enums/component.enum';
const BAR_STATUS_CLASSES = {
    [ProgressStatus.SUCCESS]: 'bg-emerald-500',
    [ProgressStatus.WARNING]: 'bg-amber-500',
    [ProgressStatus.ERROR]: 'bg-rose-500',
    [ProgressStatus.ACTIVE]: 'bg-gradient-to-r from-indigo-500 to-cyan-400',
    [ProgressStatus.NORMAL]: 'bg-indigo-600 dark:bg-indigo-500'
};
const CIRCLE_STATUS_COLORS = {
    [ProgressStatus.SUCCESS]: '#10b981',
    [ProgressStatus.WARNING]: '#f59e0b',
    [ProgressStatus.ERROR]: '#f43f5e',
    [ProgressStatus.ACTIVE]: '#6366f1',
    [ProgressStatus.NORMAL]: '#4f46e5'
};
let ProgressComponent = class ProgressComponent {
    percent = input(0);
    variant = input(ProgressVariant.BAR);
    status = input(ProgressStatus.NORMAL);
    showInfo = input(true);
    strokeWidth = input(8);
    circleSize = input(100);
    indeterminate = input(false);
    striped = input(false);
    color = input(undefined);
    trackColor = input(undefined);
    normalizedPercent = computed(() => {
        return Math.max(0, Math.min(100, this.percent()));
    });
    isCircle = computed(() => {
        const v = String(this.variant());
        return v === 'circle' || v === 'dashboard';
    });
    circleRadius = computed(() => {
        return (this.circleSize() - this.strokeWidth()) / 2;
    });
    circleCircumference = computed(() => {
        return 2 * Math.PI * this.circleRadius();
    });
    circleDashOffset = computed(() => {
        const p = this.indeterminate() ? 75 : this.normalizedPercent();
        return this.circleCircumference() - (p / 100) * this.circleCircumference();
    });
    barColorClass = computed(() => {
        if (this.color())
            return '';
        const st = String(this.status());
        return BAR_STATUS_CLASSES[st] || BAR_STATUS_CLASSES[ProgressStatus.NORMAL];
    });
    circleStrokeColor = computed(() => {
        const c = this.color();
        if (c)
            return c;
        const st = String(this.status());
        return CIRCLE_STATUS_COLORS[st] || CIRCLE_STATUS_COLORS[ProgressStatus.NORMAL];
    });
};
ProgressComponent = __decorate([
    Component({
        selector: 'erp-progress, erp-progress-bar, erp-progress-circle',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './progress.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], ProgressComponent);
export { ProgressComponent };
//# sourceMappingURL=progress.component.js.map