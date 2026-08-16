import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
export declare class SliderComponent implements ControlValueAccessor {
    label?: string;
    min: number;
    max: number;
    step: number;
    showValue: boolean;
    unit?: string;
    disabled: boolean;
    loading: boolean;
    helperText?: string;
    valueChange: EventEmitter<number>;
    value: import("@angular/core").WritableSignal<number>;
    onChange: (val: number) => void;
    onTouched: () => void;
    readonly percentage: import("@angular/core").Signal<number>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onSliderInput(event: Event): void;
}
