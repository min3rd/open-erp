import { OnDestroy } from '@angular/core';
import { DrawerPlacement, DrawerSize } from '../../enums/component.enum';
export declare class DrawerComponent implements OnDestroy {
    readonly visible: import("@angular/core").ModelSignal<boolean>;
    readonly placement: import("@angular/core").InputSignal<"left" | "right" | "top" | "bottom" | DrawerPlacement>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | "xl" | "full" | DrawerSize>;
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly subtitle: import("@angular/core").InputSignal<string | undefined>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly closable: import("@angular/core").InputSignal<boolean>;
    readonly maskClosable: import("@angular/core").InputSignal<boolean>;
    readonly showFooter: import("@angular/core").InputSignal<boolean>;
    readonly okText: import("@angular/core").InputSignal<string>;
    readonly cancelText: import("@angular/core").InputSignal<string>;
    readonly close: import("@angular/core").OutputEmitterRef<void>;
    readonly ok: import("@angular/core").OutputEmitterRef<void>;
    readonly isHorizontal: import("@angular/core").Signal<boolean>;
    readonly placementClasses: import("@angular/core").Signal<string>;
    readonly sizeClasses: import("@angular/core").Signal<string>;
    constructor();
    ngOnDestroy(): void;
    onEscape(): void;
    handleClose(): void;
    onMaskClick(event: MouseEvent): void;
}
