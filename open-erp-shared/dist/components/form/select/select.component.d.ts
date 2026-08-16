import { EventEmitter, ElementRef } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { IconName } from '../../icon/icon.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
export interface SelectOption {
    label: string;
    value: any;
    icon?: IconName;
    description?: string;
    disabled?: boolean;
}
export declare class SelectComponent implements ControlValueAccessor {
    private elementRef;
    label?: string;
    placeholder: string;
    options: SelectOption[];
    searchable: boolean;
    clearable: boolean;
    size: InputSize | 'sm' | 'md' | 'lg';
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    valueChange: EventEmitter<any>;
    selectedValue: import("@angular/core").WritableSignal<any>;
    isOpen: import("@angular/core").WritableSignal<boolean>;
    searchTerm: import("@angular/core").WritableSignal<string>;
    onChange: (val: any) => void;
    onTouched: () => void;
    constructor(elementRef: ElementRef);
    onClickOutside(event: MouseEvent): void;
    readonly filteredOptions: import("@angular/core").Signal<SelectOption[]>;
    readonly selectedOption: import("@angular/core").Signal<SelectOption | undefined>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    toggleDropdown(): void;
    selectOption(opt: SelectOption): void;
    clearSelection(event: MouseEvent): void;
    getSizeClasses(): string;
}
