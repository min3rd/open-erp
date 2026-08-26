import { ElementRef } from '@angular/core';
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
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly placeholder: import("@angular/core").InputSignal<string>;
    readonly items: import("@angular/core").InputSignal<(string | AutocompleteItem)[]>;
    readonly minLength: import("@angular/core").InputSignal<number>;
    readonly status: import("@angular/core").InputSignal<"warning" | "none" | "valid" | "invalid" | ValidationStatus>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly errorMessage: import("@angular/core").InputSignal<string | undefined>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly required: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly itemSelect: import("@angular/core").OutputEmitterRef<any>;
    query: import("@angular/core").WritableSignal<string>;
    isOpen: import("@angular/core").WritableSignal<boolean>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: any) => void;
    onTouched: () => void;
    constructor(elementRef: ElementRef);
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
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
