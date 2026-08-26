import { ControlValueAccessor } from '@angular/forms';
import { ValidationStatus } from '../../../enums/component.enum';
export declare class TagInputComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly placeholder: import("@angular/core").InputSignal<string>;
    readonly maxTags: import("@angular/core").InputSignal<number | undefined>;
    readonly allowDuplicates: import("@angular/core").InputSignal<boolean>;
    readonly status: import("@angular/core").InputSignal<"warning" | "none" | "valid" | "invalid" | ValidationStatus>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly errorMessage: import("@angular/core").InputSignal<string | undefined>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly required: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly tagsChange: import("@angular/core").OutputEmitterRef<string[]>;
    tags: import("@angular/core").WritableSignal<string[]>;
    inputValue: import("@angular/core").WritableSignal<string>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: string[]) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onKeyDown(event: KeyboardEvent): void;
    addTag(): void;
    removeTag(index: number): void;
}
