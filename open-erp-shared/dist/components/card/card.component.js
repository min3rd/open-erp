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
import { CardVariant } from '../../enums/component.enum';
let CardComponent = class CardComponent {
    title;
    subtitle;
    icon;
    coverImage;
    variant = CardVariant.ELEVATED;
    hoverable = false;
    loading = false;
    padded = true;
    getVariantClasses() {
        const v = String(this.variant);
        switch (v) {
            case 'outlined':
                return 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
            case 'filled':
                return 'bg-slate-50 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-700/60';
            case 'ghost':
                return 'bg-transparent';
            case 'elevated':
            default:
                return 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-900/5';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], CardComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CardComponent.prototype, "subtitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CardComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CardComponent.prototype, "coverImage", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CardComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CardComponent.prototype, "hoverable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CardComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CardComponent.prototype, "padded", void 0);
CardComponent = __decorate([
    Component({
        selector: 'erp-card',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './card.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], CardComponent);
export { CardComponent };
//# sourceMappingURL=card.component.js.map