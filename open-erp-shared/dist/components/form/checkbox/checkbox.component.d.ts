import { ControlValueAccessor } from '@angular/forms';
export declare class CheckboxComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string>;
    readonly description: import("@angular/core").InputSignal<string | undefined>;
    readonly indeterminate: import("@angular/core").InputSignal<boolean>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly checkedChange: import("@angular/core").OutputEmitterRef<boolean>;
    checked: import("@angular/core").WritableSignal<boolean>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: boolean) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    toggle(): void;
    onKeyDown(event: KeyboardEvent): void;
}
