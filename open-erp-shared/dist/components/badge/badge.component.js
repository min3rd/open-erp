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
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { BadgeVariant, BadgeColor } from '../../enums/component.enum';
let BadgeComponent = class BadgeComponent {
    value;
    variant = BadgeVariant.SUBTLE;
    color = BadgeColor.PRIMARY;
    pill = true;
    loading = false;
    getBadgeClasses() {
        const v = String(this.variant);
        const c = String(this.color);
        const classes = [
            this.pill ? 'rounded-full' : 'rounded-lg',
            'inline-flex items-center gap-1.5 font-bold tracking-tight select-none transition-all'
        ];
        if (v === 'dot') {
            classes.push('px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700');
            return classes.join(' ');
        }
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
        else { // subtle
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
        return classes.join(' ');
    }
    getDotColor() {
        const c = String(this.color);
        switch (c) {
            case 'success': return 'bg-emerald-500';
            case 'warning': return 'bg-amber-500';
            case 'danger': return 'bg-rose-500';
            case 'info': return 'bg-cyan-500';
            case 'neutral': return 'bg-slate-400';
            case 'primary':
            default: return 'bg-indigo-500';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], BadgeComponent.prototype, "value", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BadgeComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BadgeComponent.prototype, "color", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BadgeComponent.prototype, "pill", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BadgeComponent.prototype, "loading", void 0);
BadgeComponent = __decorate([
    Component({
        selector: 'erp-badge',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './badge.component.html'
    })
], BadgeComponent);
export { BadgeComponent };
//# sourceMappingURL=badge.component.js.map