var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerSize, SpinnerVariant } from '../../enums/component.enum';
const SIZE_CLASSES = {
    [SpinnerSize.XS]: 'w-3 h-3',
    [SpinnerSize.SM]: 'w-4 h-4',
    [SpinnerSize.LG]: 'w-8 h-8',
    [SpinnerSize.XL]: 'w-12 h-12',
    [SpinnerSize.MD]: 'w-6 h-6'
};
const DOT_SIZE_CLASSES = {
    [SpinnerSize.XS]: 'w-1 h-1',
    [SpinnerSize.SM]: 'w-1.5 h-1.5',
    [SpinnerSize.LG]: 'w-3 h-3',
    [SpinnerSize.XL]: 'w-4 h-4',
    [SpinnerSize.MD]: 'w-2 h-2'
};
let SpinnerComponent = class SpinnerComponent {
    size = input(SpinnerSize.MD);
    variant = input(SpinnerVariant.SPIN);
    color = input('text-indigo-600 dark:text-indigo-400');
    label = input(undefined);
    sizeClass = computed(() => {
        const s = String(this.size());
        return SIZE_CLASSES[s] || SIZE_CLASSES[SpinnerSize.MD];
    });
    dotSizeClass = computed(() => {
        const s = String(this.size());
        return DOT_SIZE_CLASSES[s] || DOT_SIZE_CLASSES[SpinnerSize.MD];
    });
};
SpinnerComponent = __decorate([
    Component({
        selector: 'erp-spinner, erp-loader',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './spinner.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], SpinnerComponent);
export { SpinnerComponent };
//# sourceMappingURL=spinner.component.js.map