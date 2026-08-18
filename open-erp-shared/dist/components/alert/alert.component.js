var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { AlertVariant } from '../../enums/component.enum';
let AlertComponent = class AlertComponent {
    variant = AlertVariant.INFO;
    title;
    message;
    icon;
    showIcon = true;
    closable = false;
    banner = false;
    bordered = true;
    closed = new EventEmitter();
    visible = true;
    get defaultIcon() {
        if (this.icon)
            return this.icon;
        switch (this.variant) {
            case 'success':
            case AlertVariant.SUCCESS:
                return 'check-circle';
            case 'warning':
            case AlertVariant.WARNING:
                return 'alert-triangle';
            case 'error':
            case AlertVariant.ERROR:
                return 'alert-circle';
            case 'neutral':
            case AlertVariant.NEUTRAL:
                return 'info';
            case 'info':
            case AlertVariant.INFO:
            default:
                return 'info';
        }
    }
    get containerClasses() {
        const base = 'relative transition-all duration-200';
        const shape = this.banner ? 'rounded-none px-6 py-3.5' : 'rounded-2xl p-4';
        const border = this.bordered ? 'border' : 'border-0';
        switch (this.variant) {
            case 'success':
            case AlertVariant.SUCCESS:
                return `${base} ${shape} ${border} bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200`;
            case 'warning':
            case AlertVariant.WARNING:
                return `${base} ${shape} ${border} bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200`;
            case 'error':
            case AlertVariant.ERROR:
                return `${base} ${shape} ${border} bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200`;
            case 'neutral':
            case AlertVariant.NEUTRAL:
                return `${base} ${shape} ${border} bg-slate-100/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200`;
            case 'info':
            case AlertVariant.INFO:
            default:
                return `${base} ${shape} ${border} bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200`;
        }
    }
    get iconClasses() {
        switch (this.variant) {
            case 'success':
            case AlertVariant.SUCCESS:
                return 'text-emerald-600 dark:text-emerald-400';
            case 'warning':
            case AlertVariant.WARNING:
                return 'text-amber-600 dark:text-amber-400';
            case 'error':
            case AlertVariant.ERROR:
                return 'text-rose-600 dark:text-rose-400';
            case 'neutral':
            case AlertVariant.NEUTRAL:
                return 'text-slate-600 dark:text-slate-400';
            case 'info':
            case AlertVariant.INFO:
            default:
                return 'text-indigo-600 dark:text-indigo-400';
        }
    }
    close() {
        this.visible = false;
        this.closed.emit();
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], AlertComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AlertComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AlertComponent.prototype, "message", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AlertComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AlertComponent.prototype, "showIcon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AlertComponent.prototype, "closable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AlertComponent.prototype, "banner", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AlertComponent.prototype, "bordered", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], AlertComponent.prototype, "closed", void 0);
AlertComponent = __decorate([
    Component({
        selector: 'erp-alert, erp-banner',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './alert.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], AlertComponent);
export { AlertComponent };
//# sourceMappingURL=alert.component.js.map