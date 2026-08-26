import { AlertVariant } from '../../enums/component.enum';
export declare class AlertComponent {
    readonly variant: import("@angular/core").InputSignal<"success" | "warning" | "info" | "neutral" | "error" | AlertVariant>;
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly message: import("@angular/core").InputSignal<string | undefined>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly showIcon: import("@angular/core").InputSignal<boolean>;
    readonly closable: import("@angular/core").InputSignal<boolean>;
    readonly banner: import("@angular/core").InputSignal<boolean>;
    readonly bordered: import("@angular/core").InputSignal<boolean>;
    readonly closed: import("@angular/core").OutputEmitterRef<void>;
    visible: import("@angular/core").WritableSignal<boolean>;
    readonly defaultIcon: import("@angular/core").Signal<string>;
    readonly containerClasses: import("@angular/core").Signal<string>;
    readonly iconClasses: import("@angular/core").Signal<string>;
    close(): void;
}
