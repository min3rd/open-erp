import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { IconName } from '../../icon/icon.component';
export interface RadioOption {
    label: string;
    value: any;
    description?: string;
    icon?: IconName;
    disabled?: boolean;
}
export declare class RadioGroupComponent implements ControlValueAccessor {
    label?: string;
    options: RadioOption[];
    orientation: 'vertical' | 'horizontal';
    cardMode: boolean;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    helperText?: string;
    errorMessage?: string;
    valueChange: EventEmitter<any>;
    selectedValue: import("@angular/core").WritableSignal<any>;
    onChange: (val: any) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    selectOption(opt: RadioOption): void;
}
