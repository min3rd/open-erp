var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { DrawerPlacement, DrawerSize } from '../../enums/component.enum';
let DrawerComponent = class DrawerComponent {
    visible = false;
    placement = DrawerPlacement.RIGHT;
    size = DrawerSize.MD;
    title;
    subtitle;
    icon;
    closable = true;
    maskClosable = true;
    showFooter = true;
    okText = 'Xác nhận';
    cancelText = 'Đóng';
    visibleChange = new EventEmitter();
    close = new EventEmitter();
    ok = new EventEmitter();
    onEscape() {
        if (this.visible && this.closable) {
            this.handleClose();
        }
    }
    ngOnChanges(changes) {
        if (changes['visible']) {
            if (typeof document !== 'undefined') {
                if (this.visible) {
                    document.body.classList.add('overflow-hidden');
                }
                else {
                    document.body.classList.remove('overflow-hidden');
                }
            }
        }
    }
    get isHorizontal() {
        return this.placement === 'left' || this.placement === 'right';
    }
    get placementClasses() {
        switch (this.placement) {
            case 'left':
                return 'top-0 bottom-0 left-0 h-full animate-in slide-in-from-left';
            case 'top':
                return 'top-0 left-0 right-0 w-full animate-in slide-in-from-top';
            case 'bottom':
                return 'bottom-0 left-0 right-0 w-full animate-in slide-in-from-bottom';
            case 'right':
            default:
                return 'top-0 bottom-0 right-0 h-full animate-in slide-in-from-right';
        }
    }
    get sizeClasses() {
        if (this.isHorizontal) {
            switch (this.size) {
                case 'sm':
                    return 'w-80 max-w-[85vw]';
                case 'lg':
                    return 'w-[540px] max-w-[90vw]';
                case 'xl':
                    return 'w-[720px] max-w-[95vw]';
                case 'full':
                    return 'w-screen';
                case 'md':
                default:
                    return 'w-96 max-w-[90vw]';
            }
        }
        else {
            switch (this.size) {
                case 'sm':
                    return 'h-64 max-h-[85vh]';
                case 'lg':
                    return 'h-[480px] max-h-[90vh]';
                case 'xl':
                    return 'h-[640px] max-h-[95vh]';
                case 'full':
                    return 'h-screen';
                case 'md':
                default:
                    return 'h-96 max-h-[90vh]';
            }
        }
    }
    handleClose() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.close.emit();
    }
    onMaskClick(event) {
        if (this.maskClosable && event.target.classList.contains('drawer-mask')) {
            this.handleClose();
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DrawerComponent.prototype, "visible", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DrawerComponent.prototype, "placement", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DrawerComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DrawerComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DrawerComponent.prototype, "subtitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DrawerComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DrawerComponent.prototype, "closable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DrawerComponent.prototype, "maskClosable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DrawerComponent.prototype, "showFooter", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DrawerComponent.prototype, "okText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DrawerComponent.prototype, "cancelText", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], DrawerComponent.prototype, "visibleChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], DrawerComponent.prototype, "close", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], DrawerComponent.prototype, "ok", void 0);
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
        styles: [`
    :host {
      display: contents;
    }
  `]
    })
], DrawerComponent);
export { DrawerComponent };
//# sourceMappingURL=drawer.component.js.map