import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
export declare class CheckboxComponent implements ControlValueAccessor {
    label: string;
    description?: string;
    indeterminate: boolean;
    disabled: boolean;
    loading: boolean;
    checkedChange: EventEmitter<boolean>;
    checked: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: boolean) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    toggle(): void;
}
