import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ValidationStatus } from '../../../enums/component.enum';
export declare class TextareaComponent implements ControlValueAccessor {
    label?: string;
    placeholder: string;
    rows: number;
    maxLength?: number;
    showCount: boolean;
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    loading: boolean;
    valueChange: EventEmitter<string>;
    value: import("@angular/core").WritableSignal<string>;
    onChange: (val: string) => void;
    onTouched: () => void;
    readonly currentLength: import("@angular/core").Signal<number>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onInput(event: Event): void;
    getStatusClasses(): string;
}
