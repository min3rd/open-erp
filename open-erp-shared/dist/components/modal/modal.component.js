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
import { ModalSize } from '../../enums/component.enum';
const SIZE_CLASSES = {
    [ModalSize.XS]: 'max-w-xs',
    [ModalSize.SM]: 'max-w-sm',
    [ModalSize.MD]: 'max-w-lg',
    [ModalSize.LG]: 'max-w-2xl',
    [ModalSize.XL]: 'max-w-4xl',
    [ModalSize.FULL]: 'max-w-[95vw] h-[90vh]'
};
let ModalComponent = class ModalComponent {
    visible = model(false);
    title = input(undefined);
    subtitle = input(undefined);
    icon = input(undefined);
    size = input(ModalSize.MD);
    closable = input(true);
    maskClosable = input(true);
    showFooter = input(true);
    okText = input('Xác nhận');
    cancelText = input('Hủy bỏ');
    okLoading = input(false);
    centered = input(true);
    ok = output();
    cancel = output();
    constructor() {
        effect(() => {
            const isVisible = this.visible();
            if (typeof document !== 'undefined') {
                if (isVisible) {
                    document.body.classList.add('overflow-hidden');
                }
                else {
                    document.body.classList.remove('overflow-hidden');
                }
            }
        });
    }
    sizeClasses = computed(() => {
        const s = String(this.size());
        return SIZE_CLASSES[s] || SIZE_CLASSES[ModalSize.MD];
    });
    onEscape() {
        if (this.visible() && this.closable()) {
            this.close();
        }
    }
    ngOnDestroy() {
        if (typeof document !== 'undefined') {
            document.body.classList.remove('overflow-hidden');
        }
    }
    close() {
        this.visible.set(false);
        this.cancel.emit();
    }
    onMaskClick(event) {
        if (this.maskClosable() && event.target.classList.contains('modal-mask')) {
            this.close();
        }
    }
    handleOk() {
        this.ok.emit();
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: contents;
    }
  `]
    }),
    __metadata("design:paramtypes", [])
], ModalComponent);
export { ModalComponent };
//# sourceMappingURL=modal.component.js.map