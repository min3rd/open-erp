var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateType } from '../../enums/component.enum';
const ICONS = {
    [EmptyStateType.NOT_FOUND]: 'search',
    [EmptyStateType.ERROR]: 'alert-circle',
    [EmptyStateType.MAINTENANCE]: 'alert-triangle',
    [EmptyStateType.NO_DATA]: 'inbox'
};
let EmptyStateComponent = class EmptyStateComponent {
    title = input('Không tìm thấy dữ liệu');
    description = input('');
    type = input(EmptyStateType.NO_DATA);
    customIcon = input(undefined);
    loading = input(false);
    iconName = computed(() => {
        const custom = this.customIcon();
        if (custom)
            return custom;
        const t = String(this.type());
        return ICONS[t] || ICONS[EmptyStateType.NO_DATA];
    });
};
EmptyStateComponent = __decorate([
    Component({
        selector: 'erp-empty-state',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './empty-state.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], EmptyStateComponent);
export { EmptyStateComponent };
//# sourceMappingURL=empty-state.component.js.map