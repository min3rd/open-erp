import { TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
export declare class PortalDirective implements OnInit, OnDestroy {
    private templateRef;
    private viewContainerRef;
    targetSelector?: string;
    private embeddedView?;
    constructor(templateRef: TemplateRef<any>, viewContainerRef: ViewContainerRef);
    ngOnInit(): void;
    ngOnDestroy(): void;
}
