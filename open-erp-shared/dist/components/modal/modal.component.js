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
import { ModalSize } from '../../enums/component.enum';
let ModalComponent = class ModalComponent {
    visible = false;
    title;
    subtitle;
    icon;
    size = ModalSize.MD;
    closable = true;
    maskClosable = true;
    showFooter = true;
    okText = 'Xác nhận';
    cancelText = 'Hủy bỏ';
    okLoading = false;
    centered = true;
    visibleChange = new EventEmitter();
    ok = new EventEmitter();
    cancel = new EventEmitter();
    onEscape() {
        if (this.visible && this.closable) {
            this.close();
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
    get sizeClasses() {
        switch (this.size) {
            case 'xs':
                return 'max-w-xs';
            case 'sm':
                return 'max-w-sm';
            case 'lg':
                return 'max-w-2xl';
            case 'xl':
                return 'max-w-4xl';
            case 'full':
                return 'max-w-[95vw] h-[90vh]';
            case 'md':
            default:
                return 'max-w-lg';
        }
    }
    close() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancel.emit();
    }
    onMaskClick(event) {
        if (this.maskClosable && event.target.classList.contains('modal-mask')) {
            this.close();
        }
    }
    handleOk() {
        this.ok.emit();
    }
};
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ModalComponent.prototype, "visible", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ModalComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ModalComponent.prototype, "subtitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ModalComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ModalComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ModalComponent.prototype, "closable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ModalComponent.prototype, "maskClosable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ModalComponent.prototype, "showFooter", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ModalComponent.prototype, "okText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ModalComponent.prototype, "cancelText", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ModalComponent.prototype, "okLoading", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ModalComponent.prototype, "centered", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ModalComponent.prototype, "visibleChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ModalComponent.prototype, "ok", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ModalComponent.prototype, "cancel", void 0);
__decorate([
    HostListener('document:keydown.escape'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ModalComponent.prototype, "onEscape", null);
ModalComponent = __decorate([
    Component({
        selector: 'erp-modal, erp-dialog',
        standalone: true,
        imports: [CommonModule, IconComponent, ButtonComponent],
        templateUrl: './modal.component.html',
        styles: [`
    :host {
      display: contents;
    }
  `]
    })
], ModalComponent);
export { ModalComponent };
//# sourceMappingURL=modal.component.js.map