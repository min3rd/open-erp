var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';
import { ToastPosition } from '../../enums/component.enum';
let ToastContainerComponent = class ToastContainerComponent {
    toastService = inject(ToastService);
    get containerPositionClasses() {
        const pos = this.toastService.position();
        switch (pos) {
            case 'top-left':
            case ToastPosition.TOP_LEFT:
                return 'top-0 left-0 items-start';
            case 'bottom-left':
            case ToastPosition.BOTTOM_LEFT:
                return 'bottom-0 left-0 items-start flex-col-reverse';
            case 'bottom-right':
            case ToastPosition.BOTTOM_RIGHT:
                return 'bottom-0 right-0 items-end flex-col-reverse';
            case 'top-center':
            case ToastPosition.TOP_CENTER:
                return 'top-0 left-1/2 -translate-x-1/2 items-center';
            case 'bottom-center':
            case ToastPosition.BOTTOM_CENTER:
                return 'bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse';
            case 'top-right':
            case ToastPosition.TOP_RIGHT:
            default:
                return 'top-0 right-0 items-end';
        }
    }
};
ToastContainerComponent = __decorate([
    Component({
        selector: 'erp-toast-container',
        standalone: true,
        imports: [CommonModule, ToastComponent],
        template: `
    <div [class]="containerPositionClasses"
         class="fixed z-[9999] pointer-events-none p-4 flex flex-col gap-3 transition-all duration-300">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto transition-all duration-300 transform animate-in slide-in-from-top-2 fade-in">
          <erp-toast [toast]="toast" (close)="toastService.dismiss(toast.id)"></erp-toast>
        </div>
      }
    </div>
  `
    })
], ToastContainerComponent);
export { ToastContainerComponent };
//# sourceMappingURL=toast-container.component.js.map