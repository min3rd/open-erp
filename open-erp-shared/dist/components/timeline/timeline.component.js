var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { TimelinePosition } from '../../enums/component.enum';
const DOT_CLASSES = {
    success: 'bg-emerald-500 text-white ring-4 ring-emerald-500/20',
    warning: 'bg-amber-500 text-white ring-4 ring-amber-500/20',
    danger: 'bg-rose-500 text-white ring-4 ring-rose-500/20',
    neutral: 'bg-slate-400 text-white ring-4 ring-slate-400/20',
    primary: 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
};
let TimelineComponent = class TimelineComponent {
    items = input([]);
    position = input(TimelinePosition.LEFT);
    reverse = input(false);
    loading = input(false);
    normalizedItems = computed(() => {
        const raw = this.items();
        return this.reverse() ? [...raw].reverse() : raw;
    });
    getDotClasses(item) {
        const c = item.color || 'primary';
        return DOT_CLASSES[c] || DOT_CLASSES['primary'];
    }
};
TimelineComponent = __decorate([
    Component({
        selector: 'erp-timeline',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './timeline.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], TimelineComponent);
export { TimelineComponent };
//# sourceMappingURL=timeline.component.js.map