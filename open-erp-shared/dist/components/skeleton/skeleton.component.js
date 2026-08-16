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
let SkeletonComponent = class SkeletonComponent {
    width = '100%';
    height = '1rem';
    shape = 'rounded';
    className = '';
    getShapeClasses() {
        switch (this.shape) {
            case 'circle':
                return 'rounded-full';
            case 'pill':
                return 'rounded-full';
            case 'rect':
                return 'rounded-none';
            case 'rounded':
            default:
                return 'rounded-xl';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], SkeletonComponent.prototype, "width", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SkeletonComponent.prototype, "height", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SkeletonComponent.prototype, "shape", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SkeletonComponent.prototype, "className", void 0);
SkeletonComponent = __decorate([
    Component({
        selector: 'erp-skeleton',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './skeleton.component.html'
    })
], SkeletonComponent);
export { SkeletonComponent };
//# sourceMappingURL=skeleton.component.js.map