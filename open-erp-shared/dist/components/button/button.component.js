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
    [ButtonVariant.SECONDARY]: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    [ButtonVariant.OUTLINE]: 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
    [ButtonVariant.DANGER]: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20',
    [ButtonVariant.GHOST]: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
    [ButtonVariant.SUCCESS]: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
    [ButtonVariant.PRIMARY]: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20'
};
const SIZE_CLASSES = {
    [ButtonSize.SM]: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    [ButtonSize.LG]: 'px-6 py-3 text-sm rounded-2xl gap-2.5 font-bold',
    [ButtonSize.MD]: 'px-4 py-2.5 text-xs rounded-xl gap-2 font-semibold'
};
let ButtonComponent = class ButtonComponent {
    variant = input(ButtonVariant.PRIMARY);
    size = input(ButtonSize.MD);
    type = input('button');
    disabled = input(false);
    loading = input(false);
    skeleton = input(false);
    iconLeft = input(undefined);
    iconRight = input(undefined);
    fullWidth = input(false);
    btnClick = output();
    buttonClasses = computed(() => {
        const v = String(this.variant());
        const s = String(this.size());
        const variantCls = VARIANT_CLASSES[v] || VARIANT_CLASSES[ButtonVariant.PRIMARY];
        const sizeCls = SIZE_CLASSES[s] || SIZE_CLASSES[ButtonSize.MD];
        const widthCls = this.fullWidth() ? ' w-full' : '';
        const stateCls = (this.disabled() || this.loading())
            ? ' opacity-50 cursor-not-allowed'
            : ' cursor-pointer active:scale-98';
        return `inline-flex items-center justify-center transition-all duration-150 select-none ${variantCls} ${sizeCls}${widthCls}${stateCls}`;
    });
    iconSize = computed(() => {
        const s = String(this.size());
        return s === 'sm' ? 12 : (s === 'lg' ? 18 : 14);
    });
    skeletonHeight = computed(() => {
        const s = String(this.size());
        return s === 'sm' ? '2rem' : (s === 'lg' ? '2.75rem' : '2.375rem');
    });
    skeletonClass = computed(() => {
        return String(this.size()) === 'lg' ? 'rounded-2xl' : 'rounded-xl';
    });
    onClick(event) {
        if (!this.disabled() && !this.loading() && !this.skeleton()) {
            this.btnClick.emit(event);
        }
    }
};
ButtonComponent = __decorate([
    Component({
        selector: 'erp-button',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './button.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], ButtonComponent);
export { ButtonComponent };
//# sourceMappingURL=button.component.js.map