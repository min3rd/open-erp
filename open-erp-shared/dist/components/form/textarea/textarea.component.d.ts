import { ControlValueAccessor } from '@angular/forms';
import { ValidationStatus } from '../../../enums/component.enum';
export declare class TextareaComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly placeholder: import("@angular/core").InputSignal<string>;
    readonly rows: import("@angular/core").InputSignal<number>;
    readonly maxLength: import("@angular/core").InputSignal<number | undefined>;
    readonly showCount: import("@angular/core").InputSignal<boolean>;
    readonly status: import("@angular/core").InputSignal<"warning" | "none" | "valid" | "invalid" | ValidationStatus>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly errorMessage: import("@angular/core").InputSignal<string | undefined>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly readonly: import("@angular/core").InputSignal<boolean>;
    readonly required: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly valueChange: import("@angular/core").OutputEmitterRef<string>;
    value: import("@angular/core").WritableSignal<string>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: string) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    readonly currentLength: import("@angular/core").Signal<number>;
    readonly statusClass: import("@angular/core").Signal<"border-rose-500 focus:ring-rose-500/30 text-rose-900 dark:text-rose-100" | "border-emerald-500 focus:ring-emerald-500/30 text-emerald-900 dark:text-emerald-100" | "border-amber-500 focus:ring-amber-500/30 text-amber-900 dark:text-amber-100" | "border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white">;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onInput(event: Event): void;
}
