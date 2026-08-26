var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, model, output, ElementRef, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SpeedDialDirection, SpeedDialPosition } from '../../../enums/component.enum';
const POSITION_CLASSES = {
    [SpeedDialPosition.BOTTOM_LEFT]: 'bottom-6 left-6',
    [SpeedDialPosition.TOP_RIGHT]: 'top-6 right-6',
    [SpeedDialPosition.TOP_LEFT]: 'top-6 left-6',
    [SpeedDialPosition.BOTTOM_RIGHT]: 'bottom-6 right-6'
};
const DIRECTION_CONTAINER_CLASSES = {
    [SpeedDialDirection.DOWN]: 'flex-col top-full mt-3',
    [SpeedDialDirection.LEFT]: 'flex-row-reverse right-full mr-3',
    [SpeedDialDirection.RIGHT]: 'flex-row left-full ml-3',
    [SpeedDialDirection.UP]: 'flex-col-reverse bottom-full mb-3'
};
let SpeedDialComponent = class SpeedDialComponent {
    elementRef;
    items = input([]);
    icon = input('plus');
    activeIcon = input('x');
    direction = input(SpeedDialDirection.UP);
    position = input(SpeedDialPosition.BOTTOM_RIGHT);
    open = model(false);
    showBackdrop = input(false);
    showLabels = input(true);
    fixed = input(true);
    actionClick = output();
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    positionClass = computed(() => {
        const pos = String(this.position());
        return POSITION_CLASSES[pos] || POSITION_CLASSES[SpeedDialPosition.BOTTOM_RIGHT];
    });
    isVerticalDirection = computed(() => {
        const d = String(this.direction());
        return d === 'up' || d === 'down';
    });
    isHorizontalDirection = computed(() => {
        const d = String(this.direction());
        return d === 'left' || d === 'right';
    });
    directionContainerClass = computed(() => {
        const d = String(this.direction());
        return DIRECTION_CONTAINER_CLASSES[d] || DIRECTION_CONTAINER_CLASSES[SpeedDialDirection.UP];
    });
    onDocumentClick(event) {
        if (this.open() && !this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }
    toggle() {
        this.open.update(v => !v);
    }
    close() {
        if (this.open()) {
            this.open.set(false);
        }
    }
    onActionClick(action, event) {
        if (action.disabled)
            return;
        event.stopPropagation();
        this.actionClick.emit(action);
        this.close();
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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