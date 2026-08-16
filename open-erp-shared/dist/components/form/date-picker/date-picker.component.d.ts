import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
export declare class DatePickerComponent implements ControlValueAccessor {
    label?: string;
    placeholder: string;
    min?: string;
    max?: string;
    size: InputSize | 'sm' | 'md' | 'lg';
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    valueChange: EventEmitter<string>;
    value: import("@angular/core").WritableSignal<string>;
    onChange: (val: string) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onInputChange(event: Event): void;
    setToday(): void;
    getSizeClasses(): string;
}
