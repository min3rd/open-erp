import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ValidationStatus } from '../../../enums/component.enum';
export interface DateRange {
    startDate: string;
    endDate: string;
}
export declare class DateRangePickerComponent implements ControlValueAccessor {
    label?: string;
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    rangeChange: EventEmitter<DateRange>;
    startDate: import("@angular/core").WritableSignal<string>;
    endDate: import("@angular/core").WritableSignal<string>;
    onChange: (val: DateRange) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onStartChange(event: Event): void;
    onEndChange(event: Event): void;
    private emitRange;
    setShortcut(type: 'today' | 'week' | 'month' | 'quarter'): void;
}
