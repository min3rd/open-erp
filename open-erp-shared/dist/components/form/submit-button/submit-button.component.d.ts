import { ButtonSize } from '../../../enums/component.enum';
export declare class SubmitButtonComponent {
    readonly text: import("@angular/core").InputSignal<string>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | ButtonSize>;
    readonly submitting: import("@angular/core").InputSignal<boolean>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly icon: import("@angular/core").InputSignal<string>;
    readonly fullWidth: import("@angular/core").InputSignal<boolean>;
    readonly skeleton: import("@angular/core").InputSignal<boolean>;
    readonly submitClick: import("@angular/core").OutputEmitterRef<MouseEvent>;
}
