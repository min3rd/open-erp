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
import { IconComponent } from '../../icon/icon.component';
import { TabsVariant, TabsOrientation } from '../../../enums/component.enum';
let TabsComponent = class TabsComponent {
    items = [];
    activeTabId;
    variant = TabsVariant.LINE;
    orientation = TabsOrientation.HORIZONTAL;
    size = 'md';
    fullWidth = false;
    tabChange = new EventEmitter();
    activeTabIdChange = new EventEmitter();
    get normalizedItems() {
        return this.items.map((item, idx) => {
            if (typeof item === 'string') {
                return { id: `tab-${idx}`, label: item };
            }
            return item;
        });
    }
    get currentActiveId() {
        if (this.activeTabId)
            return this.activeTabId;
        const items = this.normalizedItems;
        return items.length > 0 ? items[0].id : '';
    }
    get isVertical() {
        return String(this.orientation) === 'vertical';
    }
    get isLineVariant() {
        return String(this.variant) === 'line';
    }
    get isPillsOrSegmented() {
        const v = String(this.variant);
        return v === 'pills' || v === 'segmented';
    }
    selectTab(item) {
        if (item.disabled || item.id === this.currentActiveId)
            return;
        this.activeTabId = item.id;
        this.activeTabIdChange.emit(item.id);
        this.tabChange.emit(item.id);
    }
    getSizeClasses() {
        switch (this.size) {
            case 'sm':
                return 'px-3 py-1.5 text-xs gap-1.5';
            case 'lg':
                return 'px-5 py-3 text-sm gap-2.5 font-bold';
            case 'md':
            default:
                return 'px-4 py-2 text-xs font-semibold gap-2';
        }
    }
    getItemClasses(item) {
        const isActive = item.id === this.currentActiveId;
        const v = String(this.variant);
        const o = String(this.orientation);
        const classes = [this.getSizeClasses()];
        if (this.fullWidth) {
            classes.push('flex-1 justify-center');
        }
        if (item.disabled) {
            classes.push('opacity-40 cursor-not-allowed');
        }
        if (v === 'line') {
            if (o === 'horizontal') {
                classes.push('border-b-2 -mb-px');
            }
            else {
                classes.push('border-r-2 -mr-px');
            }
            if (isActive) {
                classes.push('border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold');
            }
            else {
                classes.push('border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
            }
        }
        else if (v === 'pills' || v === 'segmented') {
            classes.push('rounded-xl');
            if (isActive) {
                classes.push('bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold');
            }
            else {
                classes.push('text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
            }
        }
        else if (v === 'enclosed') {
            classes.push('rounded-t-xl');
            if (isActive) {
                classes.push('bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold');
            }
            else {
                classes.push('text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
            }
        }
        return classes.join(' ');
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], TabsComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TabsComponent.prototype, "activeTabId", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TabsComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TabsComponent.prototype, "orientation", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TabsComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TabsComponent.prototype, "fullWidth", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TabsComponent.prototype, "tabChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TabsComponent.prototype, "activeTabIdChange", void 0);
TabsComponent = __decorate([
    Component({
        selector: 'erp-tabs',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './tabs.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], TabsComponent);
export { TabsComponent };
//# sourceMappingURL=tabs.component.js.map