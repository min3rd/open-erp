var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { BadgeVariant, BadgeColor } from '../../enums/component.enum';
const CORNER_CLASSES = {
    'top-left': 'absolute -top-1.5 -left-1.5 ring-2 ring-white dark:ring-slate-900 z-10',
    'bottom-right': 'absolute -bottom-1.5 -right-1.5 ring-2 ring-white dark:ring-slate-900 z-10',
    'bottom-left': 'absolute -bottom-1.5 -left-1.5 ring-2 ring-white dark:ring-slate-900 z-10',
    'top-right': 'absolute -top-1.5 -right-1.5 ring-2 ring-white dark:ring-slate-900 z-10'
};
const DOT_COLORS = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-cyan-500',
    neutral: 'bg-slate-400',
    primary: 'bg-indigo-500'
};
let BadgeComponent = class BadgeComponent {
    value = input(undefined);
    count = input(undefined);
    maxCount = input(99);
    showZero = input(false);
    corner = input(undefined);
    variant = input(BadgeVariant.SUBTLE);
    color = input(BadgeColor.PRIMARY);
    pill = input(true);
    loading = input(false);
    displayCount = computed(() => {
        const c = this.count();
        if (c !== undefined) {
            if (c <= 0 && !this.showZero())
                return undefined;
            return c > this.maxCount() ? `${this.maxCount()}+` : c;
        }
        return this.value();
    });
    isHidden = computed(() => {
        const c = this.count();
        return c !== undefined && c <= 0 && !this.showZero() && String(this.variant()) !== 'dot';
    });
    cornerClass = computed(() => {
        const c = this.corner();
        if (!c)
            return '';
        return CORNER_CLASSES[String(c)] || CORNER_CLASSES['top-right'];
    });
    dotColorClass = computed(() => {
        const c = String(this.color());
        return DOT_COLORS[c] || DOT_COLORS['primary'];
    });
    badgeClasses = computed(() => {
        const v = String(this.variant());
        const c = String(this.color());
        const classes = [
            this.pill() ? 'rounded-full' : 'rounded-lg',
            'inline-flex items-center gap-1.5 font-bold tracking-tight select-none transition-all'
        ];
        if (v === 'dot') {
            classes.push('px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700');
        }
        else {
            classes.push('px-2.5 py-0.5 text-[11px]');
            if (v === 'solid') {
                switch (c) {
                    case 'success':
                        classes.push('bg-emerald-600 text-white');
                        break;
                    case 'warning':
                        classes.push('bg-amber-500 text-white');
                        break;
                    case 'danger':
                        classes.push('bg-rose-600 text-white');
                        break;
                    case 'info':
                        classes.push('bg-cyan-600 text-white');
                        break;
                    case 'neutral':
                        classes.push('bg-slate-600 text-white');
                        break;
                    case 'primary':
                    default:
                        classes.push('bg-indigo-600 text-white');
                        break;
                }
            }
            else if (v === 'outline') {
                switch (c) {
                    case 'success':
                        classes.push('border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30');
                        break;
                    case 'warning':
                        classes.push('border border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30');
                        break;
                    case 'danger':
                        classes.push('border border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30');
                        break;
                    case 'info':
                        classes.push('border border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30');
                        break;
                    case 'neutral':
                        classes.push('border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900');
                        break;
                    case 'primary':
                    default:
                        classes.push('border border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30');
                        break;
                }
            }
            else {
                switch (c) {
                    case 'success':
                        classes.push('bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60');
                        break;
                    case 'warning':
                        classes.push('bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60');
                        break;
                    case 'danger':
                        classes.push('bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60');
                        break;
                    case 'info':
                        classes.push('bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60');
                        break;
                    case 'neutral':
                        classes.push('bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700');
                        break;
                    case 'primary':
                    default:
                        classes.push('bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60');
                        break;
                }
            }
        }
        const corner = this.cornerClass();
        if (corner)
            classes.push(corner);
        return classes.join(' ');
    });
};
BadgeComponent = __decorate([
    Component({
        selector: 'erp-badge',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './badge.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: inline-flex;
    }
  `]
    })
], BadgeComponent);
export { BadgeComponent };
//# sourceMappingURL=badge.component.js.map