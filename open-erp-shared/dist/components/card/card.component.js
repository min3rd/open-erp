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
import { CardVariant } from '../../enums/component.enum';
const VARIANT_CLASSES = {
    [CardVariant.OUTLINED]: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
    [CardVariant.FILLED]: 'bg-slate-50 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-700/60',
    [CardVariant.GHOST]: 'bg-transparent',
    [CardVariant.ELEVATED]: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-900/5'
};
let CardComponent = class CardComponent {
    title = input(undefined);
    subtitle = input(undefined);
    icon = input(undefined);
    coverImage = input(undefined);
    variant = input(CardVariant.ELEVATED);
    hoverable = input(false);
    loading = input(false);
    padded = input(true);
    variantClass = computed(() => {
        const v = String(this.variant());
        return VARIANT_CLASSES[v] || VARIANT_CLASSES[CardVariant.ELEVATED];
    });
};
CardComponent = __decorate([
    Component({
        selector: 'erp-card',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './card.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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