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
import { SpeedDialDirection, SpeedDialPosition } from '../../../enums/component.enum';
let SpeedDialComponent = class SpeedDialComponent {
    elementRef;
    items = [];
    icon = 'plus';
    activeIcon = 'x';
    direction = SpeedDialDirection.UP;
    position = SpeedDialPosition.BOTTOM_RIGHT;
    open = false;
    showBackdrop = false;
    showLabels = true;
    fixed = true;
    actionClick = new EventEmitter();
    openChange = new EventEmitter();
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    onDocumentClick(event) {
        if (this.open && !this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }
    toggle() {
        this.open = !this.open;
        this.openChange.emit(this.open);
    }
    close() {
        if (this.open) {
            this.open = false;
            this.openChange.emit(false);
        }
    }
    onActionClick(action, event) {
        if (action.disabled)
            return;
        event.stopPropagation();
        this.actionClick.emit(action);
        this.close();
    }
    getPositionClasses() {
        const pos = String(this.position);
        switch (pos) {
            case SpeedDialPosition.BOTTOM_LEFT:
            case 'bottom-left':
                return 'bottom-6 left-6';
            case SpeedDialPosition.TOP_RIGHT:
            case 'top-right':
                return 'top-6 right-6';
            case SpeedDialPosition.TOP_LEFT:
            case 'top-left':
                return 'top-6 left-6';
            case SpeedDialPosition.BOTTOM_RIGHT:
            case 'bottom-right':
            default:
                return 'bottom-6 right-6';
        }
    }
    get isVerticalDirection() {
        const d = String(this.direction);
        return d === 'up' || d === 'down';
    }
    get isHorizontalDirection() {
        const d = String(this.direction);
        return d === 'left' || d === 'right';
    }
    getDirectionContainerClasses() {
        const d = String(this.direction);
        switch (d) {
            case SpeedDialDirection.DOWN:
            case 'down':
                return 'flex-col top-full mt-3';
            case SpeedDialDirection.LEFT:
            case 'left':
                return 'flex-row-reverse right-full mr-3';
            case SpeedDialDirection.RIGHT:
            case 'right':
                return 'flex-row left-full ml-3';
            case SpeedDialDirection.UP:
            case 'up':
            default:
                return 'flex-col-reverse bottom-full mb-3';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], SpeedDialComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SpeedDialComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SpeedDialComponent.prototype, "activeIcon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SpeedDialComponent.prototype, "direction", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SpeedDialComponent.prototype, "position", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SpeedDialComponent.prototype, "open", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SpeedDialComponent.prototype, "showBackdrop", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SpeedDialComponent.prototype, "showLabels", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SpeedDialComponent.prototype, "fixed", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SpeedDialComponent.prototype, "actionClick", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SpeedDialComponent.prototype, "openChange", void 0);
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], SpeedDialComponent.prototype, "onDocumentClick", null);
SpeedDialComponent = __decorate([
    Component({
        selector: 'erp-speed-dial, erp-fab-menu',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './speed-dial.component.html',
        styles: [`
    :host {
      display: block;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], SpeedDialComponent);
export { SpeedDialComponent };
//# sourceMappingURL=speed-dial.component.js.map