var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { TypographyVariant } from '../../enums/component.enum';
const VARIANT_BASE_CLASSES = {
    [TypographyVariant.H1]: 'text-3xl sm:text-4xl tracking-tight font-black',
    [TypographyVariant.H2]: 'text-2xl sm:text-3xl tracking-tight font-extrabold',
    [TypographyVariant.H3]: 'text-xl sm:text-2xl tracking-tight font-bold',
    [TypographyVariant.H4]: 'text-lg sm:text-xl font-bold',
    [TypographyVariant.H5]: 'text-base font-bold',
    [TypographyVariant.H6]: 'text-sm font-bold uppercase tracking-wider',
    [TypographyVariant.LEAD]: 'text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed',
    [TypographyVariant.SMALL]: 'text-xs text-slate-500 dark:text-slate-400 font-medium',
    [TypographyVariant.MUTED]: 'text-xs text-slate-400 dark:text-slate-500 font-normal',
    [TypographyVariant.CODE]: 'font-mono text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700',
    [TypographyVariant.BODY]: 'text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal'
};
const SKELETON_HEIGHTS = {
    [TypographyVariant.H1]: '2.5rem',
    [TypographyVariant.H2]: '2rem',
    [TypographyVariant.H3]: '1.75rem',
    [TypographyVariant.H4]: '1.5rem',
    [TypographyVariant.LEAD]: '1.25rem'
};
let TypographyComponent = class TypographyComponent {
    variant = input(TypographyVariant.BODY);
    weight = input(undefined);
    align = input(undefined);
    gradient = input(false);
    truncate = input(false);
    loading = input(false);
    skeletonWidth = input('100%');
    typographyClasses = computed(() => {
        const v = String(this.variant());
        const classes = [VARIANT_BASE_CLASSES[v] || VARIANT_BASE_CLASSES[TypographyVariant.BODY]];
        const w = this.weight();
        if (w)
            classes.push(`font-${w}`);
        const a = this.align();
        if (a)
            classes.push(`text-${a}`);
        if (this.gradient()) {
            classes.push('bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent');
        }
        if (this.truncate()) {
            classes.push('truncate');
        }
        return classes.join(' ');
    });
    skeletonHeight = computed(() => {
        const v = String(this.variant());
        return SKELETON_HEIGHTS[v] || '1rem';
    });
};
TypographyComponent = __decorate([
    Component({
        selector: 'erp-typography, erp-heading, erp-text',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './typography.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], TypographyComponent);
export { TypographyComponent };
//# sourceMappingURL=typography.component.js.map