import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ValidationStatus } from '../../../enums/component.enum';
export declare class TagInputComponent implements ControlValueAccessor {
    label?: string;
    placeholder: string;
    maxTags?: number;
    allowDuplicates: boolean;
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    tagsChange: EventEmitter<string[]>;
    tags: import("@angular/core").WritableSignal<string[]>;
    inputValue: import("@angular/core").WritableSignal<string>;
    onChange: (val: string[]) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onKeyDown(event: KeyboardEvent): void;
    addTag(): void;
    removeTag(index: number): void;
}
