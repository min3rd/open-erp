var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
const COLOR_CLASSES = {
    muted: 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
    danger: 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300',
    slate: 'text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400',
    primary: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold'
};
const UNDERLINE_CLASSES = {
    always: 'underline underline-offset-2',
    hover: 'hover:underline underline-offset-2',
    none: 'no-underline'
};
let LinkComponent = class LinkComponent {
    href = input(undefined);
    routerLink = input(undefined);
    external = input(false);
    underline = input('hover');
    color = input('primary');
    iconLeft = input(undefined);
    iconRight = input(undefined);
    disabled = input(false);
    loading = input(false);
    colorClass = computed(() => {
        return COLOR_CLASSES[this.color()] || COLOR_CLASSES['primary'];
    });
    underlineClass = computed(() => {
        return UNDERLINE_CLASSES[this.underline()] || UNDERLINE_CLASSES['hover'];
    });
};
LinkComponent = __decorate([
    Component({
        selector: 'erp-link',
        standalone: true,
        imports: [CommonModule, RouterModule, IconComponent, SkeletonComponent],
        templateUrl: './link.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], LinkComponent);
export { LinkComponent };
//# sourceMappingURL=link.component.js.map