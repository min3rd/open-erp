import { EventEmitter, ElementRef, QueryList } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ValidationStatus } from '../../../enums/component.enum';
export declare class OtpInputComponent implements ControlValueAccessor {
    label?: string;
    length: number;
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    completed: EventEmitter<string>;
    valueChange: EventEmitter<string>;
    inputElements: QueryList<ElementRef<HTMLInputElement>>;
    digits: import("@angular/core").WritableSignal<string[]>;
    onChange: (val: string) => void;
    onTouched: () => void;
    readonly slots: import("@angular/core").Signal<number[]>;
    ngOnInit(): void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onDigitInput(event: Event, index: number): void;
    onKeyDown(event: KeyboardEvent, index: number): void;
    onPaste(event: ClipboardEvent): void;
}
