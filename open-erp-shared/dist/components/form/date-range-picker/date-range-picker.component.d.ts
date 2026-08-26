import { ControlValueAccessor } from '@angular/forms';
import { ValidationStatus } from '../../../enums/component.enum';
export interface DateRange {
    startDate: string;
    endDate: string;
}
export declare class DateRangePickerComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly status: import("@angular/core").InputSignal<"warning" | "none" | "valid" | "invalid" | ValidationStatus>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly errorMessage: import("@angular/core").InputSignal<string | undefined>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly required: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly rangeChange: import("@angular/core").OutputEmitterRef<DateRange>;
    startDate: import("@angular/core").WritableSignal<string>;
    endDate: import("@angular/core").WritableSignal<string>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: DateRange) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onStartChange(event: Event): void;
    onEndChange(event: Event): void;
    private emitRange;
    setShortcut(type: 'today' | 'week' | 'month' | 'quarter'): void;
}
