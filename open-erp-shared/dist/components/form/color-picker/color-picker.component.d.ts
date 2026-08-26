import { ControlValueAccessor } from '@angular/forms';
export declare class ColorPickerComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly presets: import("@angular/core").InputSignal<string[]>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly valueChange: import("@angular/core").OutputEmitterRef<string>;
    color: import("@angular/core").WritableSignal<string>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: string) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onColorChange(val: string): void;
}
