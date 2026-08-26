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
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly options: import("@angular/core").InputSignal<RadioOption[]>;
    readonly orientation: import("@angular/core").InputSignal<"horizontal" | "vertical">;
    readonly cardMode: import("@angular/core").InputSignal<boolean>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly required: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly errorMessage: import("@angular/core").InputSignal<string | undefined>;
    readonly valueChange: import("@angular/core").OutputEmitterRef<any>;
    selectedValue: import("@angular/core").WritableSignal<any>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: any) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    selectOption(opt: RadioOption): void;
    onKeyDown(event: KeyboardEvent, opt: RadioOption): void;
    private selectNext;
}
