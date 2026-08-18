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
import { ProgressVariant, ProgressStatus } from '../../enums/component.enum';
let ProgressComponent = class ProgressComponent {
    percent = 0;
    variant = ProgressVariant.BAR;
    status = ProgressStatus.NORMAL;
    showInfo = true;
    strokeWidth = 8;
    circleSize = 100;
    indeterminate = false;
    striped = false;
    color;
    trackColor;
    get normalizedPercent() {
        return Math.max(0, Math.min(100, this.percent));
    }
    get isCircle() {
        return this.variant === 'circle' || this.variant === 'dashboard';
    }
    get circleRadius() {
        return (this.circleSize - this.strokeWidth) / 2;
    }
    get circleCircumference() {
        return 2 * Math.PI * this.circleRadius;
    }
    get circleDashOffset() {
        const p = this.indeterminate ? 75 : this.normalizedPercent;
        return this.circleCircumference - (p / 100) * this.circleCircumference;
    }
    get barColorClass() {
        if (this.color)
            return '';
        switch (this.status) {
            case 'success':
                return 'bg-emerald-500';
            case 'warning':
                return 'bg-amber-500';
            case 'error':
                return 'bg-rose-500';
            case 'active':
                return 'bg-gradient-to-r from-indigo-500 to-cyan-400';
            case 'normal':
            default:
                return 'bg-indigo-600 dark:bg-indigo-500';
        }
    }
    get circleStrokeColor() {
        if (this.color)
            return this.color;
        switch (this.status) {
            case 'success':
                return '#10b981';
            case 'warning':
                return '#f59e0b';
            case 'error':
                return '#f43f5e';
            case 'active':
                return '#6366f1';
            case 'normal':
            default:
                return '#4f46e5';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Number)
], ProgressComponent.prototype, "percent", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ProgressComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ProgressComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ProgressComponent.prototype, "showInfo", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ProgressComponent.prototype, "strokeWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ProgressComponent.prototype, "circleSize", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ProgressComponent.prototype, "indeterminate", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ProgressComponent.prototype, "striped", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ProgressComponent.prototype, "color", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ProgressComponent.prototype, "trackColor", void 0);
ProgressComponent = __decorate([
    Component({
        selector: 'erp-progress, erp-progress-bar, erp-progress-circle',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './progress.component.html',
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