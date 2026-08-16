import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { InputSize } from '../../../enums/component.enum';
export declare class SwitchComponent implements ControlValueAccessor {
    label?: string;
    description?: string;
    size: InputSize | 'sm' | 'md' | 'lg';
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
