var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, model, output, HostListener, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { DrawerPlacement, DrawerSize } from '../../enums/component.enum';
const PLACEMENT_CLASSES = {
    left: 'top-0 bottom-0 left-0 h-full animate-in slide-in-from-left',
    top: 'top-0 left-0 right-0 w-full animate-in slide-in-from-top',
    bottom: 'bottom-0 left-0 right-0 w-full animate-in slide-in-from-bottom',
    right: 'top-0 bottom-0 right-0 h-full animate-in slide-in-from-right'
};
const HORIZONTAL_SIZE_CLASSES = {
    sm: 'w-80 max-w-[85vw]',
    lg: 'w-[540px] max-w-[90vw]',
    xl: 'w-[720px] max-w-[95vw]',
    full: 'w-screen',
    md: 'w-96 max-w-[90vw]'
};
const VERTICAL_SIZE_CLASSES = {
    sm: 'h-64 max-h-[85vh]',
    lg: 'h-[480px] max-h-[90vh]',
    xl: 'h-[640px] max-h-[95vh]',
    full: 'h-screen',
    md: 'h-96 max-h-[90vh]'
};
let DrawerComponent = class DrawerComponent {
    visible = model(false);
    placement = input(DrawerPlacement.RIGHT);
    size = input(DrawerSize.MD);
    title = input(undefined);
    subtitle = input(undefined);
    icon = input(undefined);
    closable = input(true);
    maskClosable = input(true);
    showFooter = input(true);
    okText = input('Xác nhận');
    cancelText = input('Đóng');
    close = output();
    ok = output();
    isHorizontal = computed(() => {
        const p = String(this.placement());
        return p === 'left' || p === 'right';
    });
    placementClasses = computed(() => {
        const p = String(this.placement());
        return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES['right'];
    });
    sizeClasses = computed(() => {
        const sz = String(this.size());
        if (this.isHorizontal()) {
            return HORIZONTAL_SIZE_CLASSES[sz] || HORIZONTAL_SIZE_CLASSES['md'];
        }
        return VERTICAL_SIZE_CLASSES[sz] || VERTICAL_SIZE_CLASSES['md'];
    });
    constructor() {
        effect(() => {
            const isVis = this.visible();
            if (typeof document !== 'undefined') {
                if (isVis) {
                    document.body.classList.add('overflow-hidden');
                }
                else {
                    document.body.classList.remove('overflow-hidden');
                }
            }
        });
    }
    ngOnDestroy() {
        if (typeof document !== 'undefined') {
            document.body.classList.remove('overflow-hidden');
        }
    }
    onEscape() {
        if (this.visible() && this.closable()) {
            this.handleClose();
        }
    }
    handleClose() {
        this.visible.set(false);
        this.close.emit();
    }
    onMaskClick(event) {
        if (this.maskClosable() && event.target.classList.contains('drawer-mask')) {
            this.handleClose();
        }
    }
};
__decorate([
    HostListener('document:keydown.escape'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DrawerComponent.prototype, "onEscape", null);
DrawerComponent = __decorate([
    Component({
        selector: 'erp-drawer, erp-sheet, erp-slide-over',
        standalone: true,
        imports: [CommonModule, IconComponent, ButtonComponent],
        templateUrl: './drawer.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: contents;
    }
  `]
    }),
    __metadata("design:paramtypes", [])
], DrawerComponent);
export { DrawerComponent };
//# sourceMappingURL=drawer.component.js.map