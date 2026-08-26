import { OnDestroy } from '@angular/core';
import { ModalSize } from '../../enums/component.enum';
export declare class ModalComponent implements OnDestroy {
    readonly visible: import("@angular/core").ModelSignal<boolean>;
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly subtitle: import("@angular/core").InputSignal<string | undefined>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | "xs" | "xl" | "full" | ModalSize>;
    readonly closable: import("@angular/core").InputSignal<boolean>;
    readonly maskClosable: import("@angular/core").InputSignal<boolean>;
    readonly showFooter: import("@angular/core").InputSignal<boolean>;
    readonly okText: import("@angular/core").InputSignal<string>;
    readonly cancelText: import("@angular/core").InputSignal<string>;
    readonly okLoading: import("@angular/core").InputSignal<boolean>;
    readonly centered: import("@angular/core").InputSignal<boolean>;
    readonly ok: import("@angular/core").OutputEmitterRef<void>;
    readonly cancel: import("@angular/core").OutputEmitterRef<void>;
    constructor();
    readonly sizeClasses: import("@angular/core").Signal<string>;
    onEscape(): void;
    ngOnDestroy(): void;
    close(): void;
    onMaskClick(event: MouseEvent): void;
    handleOk(): void;
}
