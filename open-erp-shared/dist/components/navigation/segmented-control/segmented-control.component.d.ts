import { ControlValueAccessor } from '@angular/forms';
import { IconName } from '../../icon/icon.component';
export interface SegmentedControlOption {
    label: string;
    value: any;
    icon?: IconName;
    badge?: string | number;
    disabled?: boolean;
}
export declare class SegmentedControlComponent implements ControlValueAccessor {
    readonly options: import("@angular/core").InputSignal<(string | SegmentedControlOption)[]>;
    readonly value: import("@angular/core").ModelSignal<any>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg">;
    readonly fullWidth: import("@angular/core").InputSignal<boolean>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    private onChange;
    private onTouched;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    readonly normalizedOptions: import("@angular/core").Signal<SegmentedControlOption[]>;
    readonly sizeClass: import("@angular/core").Signal<string>;
    readonly containerSizeClass: import("@angular/core").Signal<string>;
    readonly iconSize: import("@angular/core").Signal<18 | 14>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    selectOption(opt: SegmentedControlOption): void;
    onKeyDown(event: KeyboardEvent, currentIndex: number): void;
}
