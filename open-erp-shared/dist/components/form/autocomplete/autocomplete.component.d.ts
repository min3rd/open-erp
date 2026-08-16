import { EventEmitter, ElementRef } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { IconName } from '../../icon/icon.component';
import { ValidationStatus } from '../../../enums/component.enum';
export interface AutocompleteItem {
    label: string;
    value: any;
    category?: string;
    icon?: IconName;
}
export declare class AutocompleteComponent implements ControlValueAccessor {
    private elementRef;
    label?: string;
    placeholder: string;
    items: (string | AutocompleteItem)[];
    minLength: number;
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    itemSelect: EventEmitter<any>;
    query: import("@angular/core").WritableSignal<string>;
    isOpen: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: any) => void;
    onTouched: () => void;
    constructor(elementRef: ElementRef);
    onClickOutside(event: MouseEvent): void;
    readonly normalizedItems: import("@angular/core").Signal<AutocompleteItem[]>;
    readonly filteredItems: import("@angular/core").Signal<AutocompleteItem[]>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onInput(event: Event): void;
    selectItem(it: AutocompleteItem): void;
    clear(): void;
}
