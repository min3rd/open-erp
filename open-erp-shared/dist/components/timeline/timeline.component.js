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
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { TimelinePosition } from '../../enums/component.enum';
let TimelineComponent = class TimelineComponent {
    items = [];
    position = TimelinePosition.LEFT;
    reverse = false;
    loading = false;
    get normalizedItems() {
        return this.reverse ? [...this.items].reverse() : this.items;
    }
    getDotClasses(item) {
        const c = item.color || 'primary';
        switch (c) {
            case 'success':
                return 'bg-emerald-500 text-white ring-4 ring-emerald-500/20';
            case 'warning':
                return 'bg-amber-500 text-white ring-4 ring-amber-500/20';
            case 'danger':
                return 'bg-rose-500 text-white ring-4 ring-rose-500/20';
            case 'neutral':
                return 'bg-slate-400 text-white ring-4 ring-slate-400/20';
            case 'primary':
            default:
                return 'bg-indigo-600 text-white ring-4 ring-indigo-600/20';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], TimelineComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TimelineComponent.prototype, "position", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TimelineComponent.prototype, "reverse", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TimelineComponent.prototype, "loading", void 0);
TimelineComponent = __decorate([
    Component({
        selector: 'erp-timeline',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './timeline.component.html',
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