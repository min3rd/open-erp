var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { KbdComponent } from '../../kbd/kbd.component';
import { DropdownPlacement } from '../../../enums/component.enum';
let DropdownMenuComponent = class DropdownMenuComponent {
    elementRef;
    items = [];
    placement = DropdownPlacement.BOTTOM_START;
    trigger = 'click';
    isOpen = false;
    closeOnClickOutside = true;
    closeOnItemClick = true;
    minWidth = '12rem';
    isOpenChange = new EventEmitter();
    itemClick = new EventEmitter();
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    onDocumentClick(event) {
        if (!this.closeOnClickOutside || !this.isOpen)
            return;
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }
    toggle() {
        this.isOpen = !this.isOpen;
        this.isOpenChange.emit(this.isOpen);
    }
    open() {
        if (!this.isOpen) {
            this.isOpen = true;
            this.isOpenChange.emit(true);
        }
    }
    close() {
        if (this.isOpen) {
            this.isOpen = false;
            this.isOpenChange.emit(false);
        }
    }
    onMouseEnter() {
        if (this.trigger === 'hover') {
            this.open();
        }
    }
    onMouseLeave() {
        if (this.trigger === 'hover') {
            this.close();
        }
    }
    onItemSelect(item, event) {
        if (item.disabled || item.divider || item.header) {
            event.stopPropagation();
            return;
        }
        this.itemClick.emit(item);
        if (this.closeOnItemClick) {
            this.close();
        }
    }
    getPlacementClasses() {
        const p = String(this.placement);
        switch (p) {
            case DropdownPlacement.BOTTOM_END:
            case 'bottom-end':
                return 'top-full right-0 mt-1.5';
            case DropdownPlacement.TOP_START:
            case 'top-start':
                return 'bottom-full left-0 mb-1.5';
            case DropdownPlacement.TOP_END:
            case 'top-end':
                return 'bottom-full right-0 mb-1.5';
            case DropdownPlacement.LEFT:
            case 'left':
                return 'top-0 right-full mr-1.5';
            case DropdownPlacement.RIGHT:
            case 'right':
                return 'top-0 left-full ml-1.5';
            case DropdownPlacement.BOTTOM_START:
            case 'bottom-start':
            default:
                return 'top-full left-0 mt-1.5';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], DropdownMenuComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DropdownMenuComponent.prototype, "placement", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DropdownMenuComponent.prototype, "trigger", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DropdownMenuComponent.prototype, "isOpen", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DropdownMenuComponent.prototype, "closeOnClickOutside", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DropdownMenuComponent.prototype, "closeOnItemClick", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DropdownMenuComponent.prototype, "minWidth", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], DropdownMenuComponent.prototype, "isOpenChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], DropdownMenuComponent.prototype, "itemClick", void 0);
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], DropdownMenuComponent.prototype, "onDocumentClick", null);
DropdownMenuComponent = __decorate([
    Component({
        selector: 'erp-dropdown-menu, erp-menu',
        standalone: true,
        imports: [CommonModule, IconComponent, KbdComponent],
        templateUrl: './dropdown-menu.component.html',
        styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], DropdownMenuComponent);
export { DropdownMenuComponent };
//# sourceMappingURL=dropdown-menu.component.js.map