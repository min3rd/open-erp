var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, input, TemplateRef, ViewContainerRef } from '@angular/core';
let PortalDirective = class PortalDirective {
    templateRef;
    viewContainerRef;
    targetSelector = input(undefined, { alias: 'erpPortal' });
    embeddedView;
    constructor(templateRef, viewContainerRef) {
        this.templateRef = templateRef;
        this.viewContainerRef = viewContainerRef;
    }
    ngOnInit() {
        this.embeddedView = this.viewContainerRef.createEmbeddedView(this.templateRef);
        if (typeof document !== 'undefined') {
            const sel = this.targetSelector();
            const target = sel ? document.querySelector(sel) : document.body;
            if (target) {
                for (const rootNode of this.embeddedView.rootNodes) {
                    target.appendChild(rootNode);
                }
            }
        }
    }
    ngOnDestroy() {
        if (this.embeddedView) {
            for (const rootNode of this.embeddedView.rootNodes) {
                if (rootNode.parentNode) {
                    rootNode.parentNode.removeChild(rootNode);
                }
            }
            this.embeddedView.destroy();
        }
    }
};
PortalDirective = __decorate([
    Directive({
        selector: '[erpPortal]',
        standalone: true
    }),
    __metadata("design:paramtypes", [TemplateRef,
        ViewContainerRef])
], PortalDirective);
export { PortalDirective };
//# sourceMappingURL=portal.directive.js.map