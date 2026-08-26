import { ControlValueAccessor } from '@angular/forms';
import { InputSize } from '../../../enums/component.enum';
export declare class SwitchComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly description: import("@angular/core").InputSignal<string | undefined>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | InputSize>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly checkedChange: import("@angular/core").OutputEmitterRef<boolean>;
    checked: import("@angular/core").WritableSignal<boolean>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: boolean) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    toggle(): void;
    onKeyDown(event: KeyboardEvent): void;
}
