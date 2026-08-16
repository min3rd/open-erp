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
let KbdComponent = class KbdComponent {
    key;
    keys;
    size = 'md';
    get keyList() {
        if (this.keys && this.keys.length > 0)
            return this.keys;
        if (this.key)
            return [this.key];
        return [];
    }
    getSizeClasses() {
        switch (this.size) {
            case 'sm': return 'text-[10px] min-w-[1.25rem] h-5 px-1';
            case 'lg': return 'text-xs min-w-[2rem] h-7 px-2.5';
            case 'md':
            default: return 'text-[11px] min-w-[1.5rem] h-6 px-1.5';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], KbdComponent.prototype, "key", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], KbdComponent.prototype, "keys", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], KbdComponent.prototype, "size", void 0);
KbdComponent = __decorate([
    Component({
        selector: 'erp-kbd',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './kbd.component.html'
    })
], KbdComponent);
export { KbdComponent };
//# sourceMappingURL=kbd.component.js.map