var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SpinnerComponent } from '../spinner/spinner.component';
let ToastComponent = class ToastComponent {
    toast;
    close = new EventEmitter();
    get iconName() {
        if (toastIconMapping(this.toast.type))
            return toastIconMapping(this.toast.type);
        return 'info';
    }
    get containerClasses() {
        switch (this.toast.type) {
            case 'success':
                return 'bg-white/95 dark:bg-slate-900/95 border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100 shadow-emerald-500/10';
            case 'warning':
                return 'bg-white/95 dark:bg-slate-900/95 border-amber-200 dark:border-amber-800/60 text-slate-900 dark:text-slate-100 shadow-amber-500/10';
            case 'error':
                return 'bg-white/95 dark:bg-slate-900/95 border-rose-200 dark:border-rose-800/60 text-slate-900 dark:text-slate-100 shadow-rose-500/10';
            case 'loading':
                return 'bg-white/95 dark:bg-slate-900/95 border-indigo-200 dark:border-indigo-800/60 text-slate-900 dark:text-slate-100 shadow-indigo-500/10';
            case 'info':
            default:
                return 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-slate-900/10';
        }
    }
    get iconColorClass() {
        switch (this.toast.type) {
            case 'success':
                return 'text-emerald-500 dark:text-emerald-400';
            case 'warning':
                return 'text-amber-500 dark:text-amber-400';
            case 'error':
                return 'text-rose-500 dark:text-rose-400';
            case 'info':
            default:
                return 'text-indigo-500 dark:text-indigo-400';
        }
    }
    get progressBarColor() {
        switch (this.toast.type) {
            case 'success':
                return 'bg-emerald-500';
            case 'warning':
                return 'bg-amber-500';
            case 'error':
                return 'bg-rose-500';
            case 'info':
            default:
                return 'bg-indigo-500';
        }
    }
};
__decorate([
    Input({ required: true }),
    __metadata("design:type", Object)
], ToastComponent.prototype, "toast", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ToastComponent.prototype, "close", void 0);
ToastComponent = __decorate([
    Component({
        selector: 'erp-toast',
        standalone: true,
        imports: [CommonModule, IconComponent, SpinnerComponent],
        template: `
    <div [class]="containerClasses"
         class="group relative flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 w-80 sm:w-96 overflow-hidden">
      
      <!-- Icon / Loading Spinner -->
      <div class="shrink-0 mt-0.5">
        @if (toast.type === 'loading') {
          <erp-spinner size="sm" variant="spin"></erp-spinner>
        } @else {
          <div [class]="iconColorClass">
            <erp-icon [name]="iconName" [size]="20"></erp-icon>
          </div>
        }
      </div>

      <!-- Toast Content -->
      <div class="flex-1 min-w-0">
        @if (toast.title) {
          <h4 class="text-xs font-bold text-slate-900 dark:text-white tracking-tight mb-0.5">{{ toast.title }}</h4>
        }
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ toast.message }}</p>

        <!-- Optional Action Button -->
        @if (toast.actionText && toast.onAction) {
          <button (click)="toast.onAction(); close.emit()"
                  type="button"
                  class="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer">
            {{ toast.actionText }}
          </button>
        }
      </div>

      <!-- Dismiss Close Button -->
      <button (click)="close.emit()"
              type="button"
              class="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Đóng">
        <erp-icon name="x" [size]="14"></erp-icon>
      </button>

      <!-- Progress Timer Bar -->
      @if (toast.duration > 0 && toast.showProgress) {
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full transition-all linear"
               [class]="progressBarColor"
               [style.animation]="'toast-progress ' + toast.duration + 'ms linear forwards'">
          </div>
        </div>
      }
    </div>
  `,
        styles: [`
    @keyframes toast-progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
    })
], ToastComponent);
export { ToastComponent };
function toastIconMapping(type) {
    switch (type) {
        case 'success':
            return 'check-circle';
        case 'warning':
            return 'alert-triangle';
        case 'error':
            return 'alert-circle';
        case 'loading':
            return 'loader';
        case 'info':
        default:
            return 'info';
    }
}
//# sourceMappingURL=toast.component.js.map