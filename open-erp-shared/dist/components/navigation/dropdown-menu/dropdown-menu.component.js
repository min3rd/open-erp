var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, model, output, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { KbdComponent } from '../../kbd/kbd.component';
import { DropdownPlacement } from '../../../enums/component.enum';
const PLACEMENT_CLASSES = {
    [DropdownPlacement.BOTTOM_END]: 'top-full right-0 mt-1.5',
    [DropdownPlacement.TOP_START]: 'bottom-full left-0 mb-1.5',
    [DropdownPlacement.TOP_END]: 'bottom-full right-0 mb-1.5',
    [DropdownPlacement.LEFT]: 'top-0 right-full mr-1.5',
    [DropdownPlacement.RIGHT]: 'top-0 left-full ml-1.5',
    [DropdownPlacement.BOTTOM_START]: 'top-full left-0 mt-1.5'
};
let DropdownMenuComponent = class DropdownMenuComponent {
    elementRef;
    items = input([]);
    placement = input(DropdownPlacement.BOTTOM_START);
    trigger = input('click');
    isOpen = model(false);
    closeOnClickOutside = input(true);
    closeOnItemClick = input(true);
    minWidth = input('12rem');
    itemClick = output();
    activeIndex = signal(-1);
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    placementClasses = computed(() => {
        const p = String(this.placement());
        return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES[DropdownPlacement.BOTTOM_START];
    });
    actionableItems = computed(() => {
        return this.items().filter(item => item.label && !item.header && !item.divider);
    });
    onDocumentClick(event) {
        if (!this.closeOnClickOutside() || !this.isOpen())
            return;
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }
    onKeyDown(event) {
        const open = this.isOpen();
        const actions = this.actionableItems();
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!open) {
                    this.open();
                }
                else if (actions.length > 0) {
                    let next = this.activeIndex() + 1;
                    while (next < actions.length && actions[next].disabled) {
                        next++;
                    }
                    if (next < actions.length) {
                        this.activeIndex.set(next);
                    }
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (open && actions.length > 0) {
                    let prev = this.activeIndex() - 1;
                    while (prev >= 0 && actions[prev].disabled) {
                        prev--;
                    }
                    if (prev >= 0) {
                        this.activeIndex.set(prev);
                    }
                }
                break;
            case 'Enter':
            case ' ':
                if (open && this.activeIndex() >= 0 && this.activeIndex() < actions.length) {
                    event.preventDefault();
                    const target = actions[this.activeIndex()];
                    if (!target.disabled) {
                        this.onItemSelect(target, event);
                    }
                }
                else if (!open && this.trigger() === 'click') {
                    event.preventDefault();
                    this.open();
                }
                break;
            case 'Escape':
                if (open) {
                    event.preventDefault();
                    this.close();
                }
                break;
            case 'Tab':
                if (open) {
                    this.close();
                }
                break;
        }
    }
    toggle() {
        if (this.isOpen()) {
            this.close();
        }
        else {
            this.open();
        }
    }
    open() {
        this.isOpen.set(true);
        this.activeIndex.set(0);
    }
    close() {
        this.isOpen.set(false);
        this.activeIndex.set(-1);
    }
    onMouseEnter() {
        if (this.trigger() === 'hover') {
            this.open();
        }
    }
    onMouseLeave() {
        if (this.trigger() === 'hover') {
            this.close();
        }
    }
    onItemSelect(item, event) {
        if (item.disabled || item.divider || item.header) {
            event.stopPropagation();
            return;
        }
        this.itemClick.emit(item);
        if (this.closeOnItemClick()) {
            this.close();
        }
    }
};
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], DropdownMenuComponent.prototype, "onDocumentClick", null);
__decorate([
    HostListener('keydown', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeyboardEvent]),
    __metadata("design:returntype", void 0)
], DropdownMenuComponent.prototype, "onKeyDown", null);
DropdownMenuComponent = __decorate([
    Component({
        selector: 'erp-dropdown-menu, erp-menu',
        standalone: true,
        imports: [CommonModule, IconComponent, KbdComponent],
        templateUrl: './dropdown-menu.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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