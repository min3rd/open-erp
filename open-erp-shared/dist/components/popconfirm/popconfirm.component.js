var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, output, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { ButtonVariant, PopoverPlacement } from '../../enums/component.enum';
const PLACEMENT_CLASSES = {
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
};
let PopconfirmComponent = class PopconfirmComponent {
    elementRef;
    title = input('Bạn có chắc chắn muốn thực hiện?');
    description = input(undefined);
    okText = input('Đồng ý');
    cancelText = input('Hủy');
    okVariant = input(ButtonVariant.PRIMARY);
    icon = input('help-circle');
    placement = input(PopoverPlacement.TOP);
    confirm = output();
    cancel = output();
    isOpen = signal(false);
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    placementClasses = computed(() => {
        const p = String(this.placement());
        return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES['top'];
    });
    onDocumentClick(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
        }
    }
    toggleOpen(event) {
        event.stopPropagation();
        this.isOpen.update(v => !v);
    }
    onConfirm() {
        this.isOpen.set(false);
        this.confirm.emit();
    }
    onCancel() {
        this.isOpen.set(false);
        this.cancel.emit();
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div class="relative inline-block">
      <!-- Target Trigger Element -->
      <div (click)="toggleOpen($event)" class="inline-block cursor-pointer">
        <ng-content></ng-content>
      </div>

      <!-- Popconfirm Modal Dialog Box -->
      @if (isOpen()) {
        <div [class]="placementClasses()"
             (click)="$event.stopPropagation()"
             class="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-xs min-w-64 transition-all duration-200 animate-in fade-in zoom-in-95">
          
          <div class="flex items-start gap-3 mb-3">
            <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <erp-icon [name]="icon()" [size]="16"></erp-icon>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 dark:text-white tracking-tight">{{ title() }}</h4>
              @if (description()) {
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ description() }}</p>
              }
            </div>
          </div>

          <!-- Buttons Row -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <erp-button variant="ghost" size="sm" (click)="onCancel()">
              {{ cancelText() }}
            </erp-button>
            <erp-button [variant]="okVariant()" size="sm" (click)="onConfirm()">
              {{ okText() }}
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