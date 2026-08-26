var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { AlertVariant } from '../../enums/component.enum';
const DEFAULT_ICONS = {
    [AlertVariant.SUCCESS]: 'check-circle',
    [AlertVariant.WARNING]: 'alert-triangle',
    [AlertVariant.ERROR]: 'alert-circle',
    [AlertVariant.NEUTRAL]: 'info',
    [AlertVariant.INFO]: 'info'
};
const VARIANT_CONTAINER_CLASSES = {
    [AlertVariant.SUCCESS]: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
    [AlertVariant.WARNING]: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
    [AlertVariant.ERROR]: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200',
    [AlertVariant.NEUTRAL]: 'bg-slate-100/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200',
    [AlertVariant.INFO]: 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
};
const VARIANT_ICON_CLASSES = {
    [AlertVariant.SUCCESS]: 'text-emerald-600 dark:text-emerald-400',
    [AlertVariant.WARNING]: 'text-amber-600 dark:text-amber-400',
    [AlertVariant.ERROR]: 'text-rose-600 dark:text-rose-400',
    [AlertVariant.NEUTRAL]: 'text-slate-600 dark:text-slate-400',
    [AlertVariant.INFO]: 'text-indigo-600 dark:text-indigo-400'
};
let AlertComponent = class AlertComponent {
    variant = input(AlertVariant.INFO);
    title = input(undefined);
    message = input(undefined);
    icon = input(undefined);
    showIcon = input(true);
    closable = input(false);
    banner = input(false);
    bordered = input(true);
    closed = output();
    visible = signal(true);
    defaultIcon = computed(() => {
        const custom = this.icon();
        if (custom)
            return custom;
        const v = String(this.variant());
        return DEFAULT_ICONS[v] || 'info';
    });
    containerClasses = computed(() => {
        const base = 'relative transition-all duration-200';
        const shape = this.banner() ? 'rounded-none px-6 py-3.5' : 'rounded-2xl p-4';
        const border = this.bordered() ? 'border' : 'border-0';
        const v = String(this.variant());
        const variantCls = VARIANT_CONTAINER_CLASSES[v] || VARIANT_CONTAINER_CLASSES[AlertVariant.INFO];
        return `${base} ${shape} ${border} ${variantCls}`;
    });
    iconClasses = computed(() => {
        const v = String(this.variant());
        return VARIANT_ICON_CLASSES[v] || VARIANT_ICON_CLASSES[AlertVariant.INFO];
    });
    close() {
        this.visible.set(false);
        this.closed.emit();
    }
};
AlertComponent = __decorate([
    Component({
        selector: 'erp-alert, erp-banner',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './alert.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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