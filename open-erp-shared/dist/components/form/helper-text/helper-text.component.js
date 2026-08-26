var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { ValidationStatus } from '../../../enums/component.enum';
const TEXT_CLASSES = {
    [ValidationStatus.INVALID]: 'text-rose-500 dark:text-rose-400',
    [ValidationStatus.VALID]: 'text-emerald-600 dark:text-emerald-400',
    [ValidationStatus.WARNING]: 'text-amber-600 dark:text-amber-400',
    [ValidationStatus.NONE]: 'text-slate-400 dark:text-slate-500'
};
const ICONS = {
    [ValidationStatus.INVALID]: 'alert-circle',
    [ValidationStatus.VALID]: 'check-circle',
    [ValidationStatus.WARNING]: 'alert-triangle'
};
let HelperTextComponent = class HelperTextComponent {
    text = input('');
    status = input(ValidationStatus.NONE);
    textClass = computed(() => {
        const st = String(this.status());
        return TEXT_CLASSES[st] || TEXT_CLASSES[ValidationStatus.NONE];
    });
    iconName = computed(() => {
        const st = String(this.status());
        return ICONS[st] || 'info';
    });
};
HelperTextComponent = __decorate([
    Component({
        selector: 'erp-helper-text',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './helper-text.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], HelperTextComponent);
export { HelperTextComponent };
//# sourceMappingURL=helper-text.component.js.map