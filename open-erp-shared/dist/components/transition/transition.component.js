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
import { TransitionType } from '../../enums/component.enum';
let TransitionComponent = class TransitionComponent {
    show = true;
    type = TransitionType.FADE;
    duration = 250;
    get transitionClasses() {
        switch (this.type) {
            case 'scale':
                return 'animate-in zoom-in-95 fade-in';
            case 'slide-up':
                return 'animate-in slide-in-from-bottom-4 fade-in';
            case 'slide-down':
                return 'animate-in slide-in-from-top-4 fade-in';
            case 'slide-left':
                return 'animate-in slide-in-from-right-4 fade-in';
            case 'slide-right':
                return 'animate-in slide-in-from-left-4 fade-in';
            case 'collapse':
                return 'overflow-hidden transition-all duration-300';
            case 'fade':
            default:
                return 'animate-in fade-in';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TransitionComponent.prototype, "show", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TransitionComponent.prototype, "type", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], TransitionComponent.prototype, "duration", void 0);
TransitionComponent = __decorate([
    Component({
        selector: 'erp-transition, erp-motion',
        standalone: true,
        imports: [CommonModule],
        template: `
    @if (show) {
      <div [class]="transitionClasses"
           [style.animation-duration.ms]="duration"
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