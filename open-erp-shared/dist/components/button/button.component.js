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
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';
let ButtonComponent = class ButtonComponent {
    variant = ButtonVariant.PRIMARY;
    size = ButtonSize.MD;
    type = 'button';
    disabled = false;
    loading = false;
    skeleton = false;
    iconLeft;
    iconRight;
    fullWidth = false;
    btnClick = new EventEmitter();
    onClick(event) {
        if (!this.disabled && !this.loading && !this.skeleton) {
            this.btnClick.emit(event);
        }
    }
    getVariantClasses() {
        const v = String(this.variant);
        switch (v) {
            case ButtonVariant.SECONDARY:
            case 'secondary':
                return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700';
            case ButtonVariant.OUTLINE:
            case 'outline':
                return 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700';
            case ButtonVariant.DANGER:
            case 'danger':
                return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20';
            case ButtonVariant.GHOST:
            case 'ghost':
                return 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300';
            case ButtonVariant.SUCCESS:
            case 'success':
                return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20';
            case ButtonVariant.PRIMARY:
            case 'primary':
            default:
                return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20';
        }
    }
    getSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case ButtonSize.SM:
            case 'sm':
                return 'px-3 py-1.5 text-xs rounded-xl gap-1.5';
            case ButtonSize.LG:
            case 'lg':
                return 'px-6 py-3 text-sm rounded-2xl gap-2.5 font-bold';
            case ButtonSize.MD:
            case 'md':
            default:
                return 'px-4 py-2.5 text-xs rounded-xl gap-2 font-semibold';
        }
    }
    getSkeletonHeight() {
        const s = String(this.size);
        switch (s) {
            case ButtonSize.SM:
            case 'sm':
                return '2rem';
            case ButtonSize.LG:
            case 'lg':
                return '2.75rem';
            case ButtonSize.MD:
            case 'md':
            default:
                return '2.375rem';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], ButtonComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ButtonComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ButtonComponent.prototype, "type", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ButtonComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ButtonComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ButtonComponent.prototype, "skeleton", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ButtonComponent.prototype, "iconLeft", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ButtonComponent.prototype, "iconRight", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ButtonComponent.prototype, "fullWidth", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ButtonComponent.prototype, "btnClick", void 0);
ButtonComponent = __decorate([
    Component({
        selector: 'erp-button',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './button.component.html'
    })
], ButtonComponent);
export { ButtonComponent };
//# sourceMappingURL=button.component.js.map