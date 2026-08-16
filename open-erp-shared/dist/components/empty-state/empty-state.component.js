var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateType } from '../../enums/component.enum';
let EmptyStateComponent = class EmptyStateComponent {
    title = 'Không tìm thấy dữ liệu';
    description = '';
    type = EmptyStateType.NO_DATA;
    customIcon;
    loading = false;
    getIconName() {
        if (this.customIcon)
            return this.customIcon;
        switch (this.type) {
            case EmptyStateType.NOT_FOUND:
            case 'not-found':
                return 'search';
            case EmptyStateType.ERROR:
            case 'error':
                return 'alert-circle';
            case EmptyStateType.MAINTENANCE:
            case 'maintenance':
                return 'alert-triangle';
            case EmptyStateType.NO_DATA:
            case 'no-data':
            default:
                return 'inbox';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], EmptyStateComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], EmptyStateComponent.prototype, "description", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], EmptyStateComponent.prototype, "type", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], EmptyStateComponent.prototype, "customIcon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], EmptyStateComponent.prototype, "loading", void 0);
EmptyStateComponent = __decorate([
    Component({
        selector: 'erp-empty-state',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './empty-state.component.html'
    })
], EmptyStateComponent);
export { EmptyStateComponent };
//# sourceMappingURL=empty-state.component.js.map