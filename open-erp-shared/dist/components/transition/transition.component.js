var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransitionType } from '../../enums/component.enum';
const TRANSITION_CLASSES = {
    scale: 'animate-in zoom-in-95 fade-in',
    'slide-up': 'animate-in slide-in-from-bottom-4 fade-in',
    'slide-down': 'animate-in slide-in-from-top-4 fade-in',
    'slide-left': 'animate-in slide-in-from-right-4 fade-in',
    'slide-right': 'animate-in slide-in-from-left-4 fade-in',
    collapse: 'overflow-hidden transition-all duration-300',
    fade: 'animate-in fade-in'
};
let TransitionComponent = class TransitionComponent {
    show = input(true);
    type = input(TransitionType.FADE);
    duration = input(250);
    transitionClasses = computed(() => {
        const t = String(this.type());
        return TRANSITION_CLASSES[t] || TRANSITION_CLASSES['fade'];
    });
};
TransitionComponent = __decorate([
    Component({
        selector: 'erp-transition, erp-motion',
        standalone: true,
        imports: [CommonModule],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    @if (show()) {
      <div [class]="transitionClasses()"
           [style.animation-duration.ms]="duration()"
           class="transition-all duration-300">
        <ng-content></ng-content>
      </div>
    }
  `,
        styles: [`
    :host {
      display: contents;
    }
  `]
    })
], TransitionComponent);
export { TransitionComponent };
//# sourceMappingURL=transition.component.js.map