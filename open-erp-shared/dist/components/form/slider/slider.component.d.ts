import { ControlValueAccessor } from '@angular/forms';
export declare class SliderComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly min: import("@angular/core").InputSignal<number>;
    readonly max: import("@angular/core").InputSignal<number>;
    readonly step: import("@angular/core").InputSignal<number>;
    readonly showValue: import("@angular/core").InputSignal<boolean>;
    readonly unit: import("@angular/core").InputSignal<string | undefined>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly valueChange: import("@angular/core").OutputEmitterRef<number>;
    value: import("@angular/core").WritableSignal<number>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: number) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    readonly percentage: import("@angular/core").Signal<number>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onSliderInput(event: Event): void;
}
