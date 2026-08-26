var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
const SIZE_CLASSES = {
    sm: 'text-[10px] min-w-[1.25rem] h-5 px-1',
    lg: 'text-xs min-w-[2rem] h-7 px-2.5',
    md: 'text-[11px] min-w-[1.5rem] h-6 px-1.5'
};
let KbdComponent = class KbdComponent {
    key = input(undefined);
    keys = input(undefined);
    size = input('md');
    keyList = computed(() => {
        const ks = this.keys();
        if (ks && ks.length > 0)
            return ks;
        const k = this.key();
        if (k)
            return [k];
        return [];
    });
    sizeClass = computed(() => {
        return SIZE_CLASSES[this.size()] || SIZE_CLASSES['md'];
    });
};
KbdComponent = __decorate([
    Component({
        selector: 'erp-kbd',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './kbd.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], KbdComponent);
export { KbdComponent };
//# sourceMappingURL=kbd.component.js.map