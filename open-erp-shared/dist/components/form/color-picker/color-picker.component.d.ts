import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
export declare class ColorPickerComponent implements ControlValueAccessor {
    label?: string;
    presets: string[];
    disabled: boolean;
    loading: boolean;
    helperText?: string;
    valueChange: EventEmitter<string>;
    color: import("@angular/core").WritableSignal<string>;
    onChange: (val: string) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onColorChange(val: string): void;
}
