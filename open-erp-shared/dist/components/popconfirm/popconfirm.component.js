var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { ButtonVariant, PopoverPlacement } from '../../enums/component.enum';
let PopconfirmComponent = class PopconfirmComponent {
    elementRef;
    title = 'Bạn có chắc chắn muốn thực hiện?';
    description;
    okText = 'Đồng ý';
    cancelText = 'Hủy';
    okVariant = ButtonVariant.PRIMARY;
    icon = 'help-circle';
    placement = PopoverPlacement.TOP;
    confirm = new EventEmitter();
    cancel = new EventEmitter();
    isOpen = false;
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    onDocumentClick(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }
    get placementClasses() {
        switch (this.placement) {
            case 'bottom':
                return 'top-full left-1/2 -translate-x-1/2 mt-2';
            case 'left':
                return 'right-full top-1/2 -translate-y-1/2 mr-2';
            case 'right':
                return 'left-full top-1/2 -translate-y-1/2 ml-2';
            case 'top':
            default:
                return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
        }
    }
    toggleOpen(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }
    onConfirm() {
        this.isOpen = false;
        this.confirm.emit();
    }
    onCancel() {
        this.isOpen = false;
        this.cancel.emit();
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], PopconfirmComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PopconfirmComponent.prototype, "description", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PopconfirmComponent.prototype, "okText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PopconfirmComponent.prototype, "cancelText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PopconfirmComponent.prototype, "okVariant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PopconfirmComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PopconfirmComponent.prototype, "placement", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], PopconfirmComponent.prototype, "confirm", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], PopconfirmComponent.prototype, "cancel", void 0);
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], PopconfirmComponent.prototype, "onDocumentClick", null);
PopconfirmComponent = __decorate([
    Component({
        selector: 'erp-popconfirm',
        standalone: true,
        imports: [CommonModule, IconComponent, ButtonComponent],
        template: `
    <div class="relative inline-block">
      <!-- Target Trigger Element -->
      <div (click)="toggleOpen($event)" class="inline-block cursor-pointer">
        <ng-content></ng-content>
      </div>

      <!-- Popconfirm Modal Dialog Box -->
      @if (isOpen) {
        <div [class]="placementClasses"
             (click)="$event.stopPropagation()"
             class="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-xs min-w-64 transition-all duration-200 animate-in fade-in zoom-in-95">
          
          <div class="flex items-start gap-3 mb-3">
            <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <erp-icon [name]="icon" [size]="16"></erp-icon>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 dark:text-white tracking-tight">{{ title }}</h4>
              @if (description) {
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ description }}</p>
              }
            </div>
          </div>

          <!-- Buttons Row -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <erp-button variant="ghost" size="sm" (click)="onCancel()">
              {{ cancelText }}
            </erp-button>
            <erp-button [variant]="okVariant" size="sm" (click)="onConfirm()">
              {{ okText }}
            </erp-button>
          </div>

        </div>
      }
    </div>
  `,
        styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], PopconfirmComponent);
export { PopconfirmComponent };
//# sourceMappingURL=popconfirm.component.js.map