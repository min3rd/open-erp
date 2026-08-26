var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';
const VARIANT_CLASSES = {
    [ButtonVariant.PRIMARY]: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-600/20 focus:ring-2 focus:ring-indigo-500/40',
    [ButtonVariant.SECONDARY]: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-400/40',
    [ButtonVariant.OUTLINE]: 'border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-400/40',
    [ButtonVariant.DANGER]: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 focus:ring-2 focus:ring-rose-500/40',
    [ButtonVariant.SUCCESS]: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-500/40',
    [ButtonVariant.GHOST]: 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-slate-400/20'
};
const SIZE_CLASSES = {
    [ButtonSize.SM]: 'w-8 h-8',
    [ButtonSize.LG]: 'w-12 h-12',
    [ButtonSize.MD]: 'w-10 h-10'
};
const ICON_SIZES = {
    [ButtonSize.SM]: 14,
    [ButtonSize.LG]: 20,
    [ButtonSize.MD]: 16
};
let IconButtonComponent = class IconButtonComponent {
    icon = input('plus');
    variant = input(ButtonVariant.GHOST);
    size = input(ButtonSize.MD);
    shape = input('rounded');
    tooltip = input(undefined);
    badge = input(undefined);
    badgeColor = input('bg-rose-500 text-white');
    disabled = input(false);
    loading = input(false);
    skeleton = input(false);
    ariaLabel = input(undefined);
    btnClick = output();
    variantClass = computed(() => {
        const v = String(this.variant());
        return VARIANT_CLASSES[v] || VARIANT_CLASSES[ButtonVariant.GHOST];
    });
    sizeClass = computed(() => {
        const s = String(this.size());
        return SIZE_CLASSES[s] || SIZE_CLASSES[ButtonSize.MD];
    });
    iconSize = computed(() => {
        const s = String(this.size());
        return ICON_SIZES[s] || ICON_SIZES[ButtonSize.MD];
    });
    shapeClass = computed(() => {
        const shp = this.shape();
        switch (shp) {
            case 'circle': return 'rounded-full';
            case 'square': return 'rounded-none';
            case 'rounded':
            default:
                return String(this.size()) === 'lg' ? 'rounded-2xl' : 'rounded-xl';
        }
    });
    onClick(event) {
        if (!this.disabled() && !this.loading() && !this.skeleton()) {
            this.btnClick.emit(event);
        }
    }
};
IconButtonComponent = __decorate([
    Component({
        selector: 'erp-icon-button',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './icon-button.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], IconButtonComponent);
export { IconButtonComponent };
//# sourceMappingURL=icon-button.component.js.map