import { ValidationStatus } from '../../../enums/component.enum';
export declare class HelperTextComponent {
    readonly text: import("@angular/core").InputSignal<string>;
    readonly status: import("@angular/core").InputSignal<"warning" | "none" | "valid" | "invalid" | ValidationStatus>;
    readonly textClass: import("@angular/core").Signal<string>;
    readonly iconName: import("@angular/core").Signal<string>;
}
