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
let IconButtonComponent = class IconButtonComponent {
    icon = 'plus';
    variant = ButtonVariant.GHOST;
    size = ButtonSize.MD;
    shape = 'rounded';
    tooltip;
    badge;
    badgeColor = 'bg-rose-500 text-white';
    disabled = false;
    loading = false;
    skeleton = false;
    ariaLabel;
    btnClick = new EventEmitter();
    onClick(event) {
        if (!this.disabled && !this.loading && !this.skeleton) {
            this.btnClick.emit(event);
        }
    }
    getVariantClasses() {
        const v = String(this.variant);
        switch (v) {
            case ButtonVariant.PRIMARY:
            case 'primary':
                return 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-600/20 focus:ring-2 focus:ring-indigo-500/40';
            case ButtonVariant.SECONDARY:
            case 'secondary':
                return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-400/40';
            case ButtonVariant.OUTLINE:
            case 'outline':
                return 'border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-400/40';
            case ButtonVariant.DANGER:
            case 'danger':
                return 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 focus:ring-2 focus:ring-rose-500/40';
            case ButtonVariant.SUCCESS:
            case 'success':
                return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-500/40';
            case ButtonVariant.GHOST:
            case 'ghost':
            default:
                return 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-slate-400/20';
        }
    }
    getSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case ButtonSize.SM:
            case 'sm':
                return 'w-8 h-8';
            case ButtonSize.LG:
            case 'lg':
                return 'w-12 h-12';
            case ButtonSize.MD:
            case 'md':
            default:
                return 'w-10 h-10';
        }
    }
    getIconSize() {
        const s = String(this.size);
        switch (s) {
            case ButtonSize.SM:
            case 'sm':
                return 14;
            case ButtonSize.LG:
            case 'lg':
                return 20;
            case ButtonSize.MD:
            case 'md':
            default:
                return 16;
        }
    }
    getShapeClasses() {
        switch (this.shape) {
            case 'circle':
                return 'rounded-full';
            case 'square':
                return 'rounded-none';
            case 'rounded':
            default:
                return this.size === 'lg' ? 'rounded-2xl' : 'rounded-xl';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], IconButtonComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], IconButtonComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], IconButtonComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], IconButtonComponent.prototype, "shape", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], IconButtonComponent.prototype, "tooltip", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], IconButtonComponent.prototype, "badge", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], IconButtonComponent.prototype, "badgeColor", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], IconButtonComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], IconButtonComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], IconButtonComponent.prototype, "skeleton", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], IconButtonComponent.prototype, "ariaLabel", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], IconButtonComponent.prototype, "btnClick", void 0);
IconButtonComponent = __decorate([
    Component({
        selector: 'erp-icon-button',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './icon-button.component.html'
    })
], IconButtonComponent);
export { IconButtonComponent };
//# sourceMappingURL=icon-button.component.js.map