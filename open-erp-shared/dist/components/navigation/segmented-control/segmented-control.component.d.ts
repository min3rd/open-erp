import { EventEmitter } from '@angular/core';
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
    options: (string | SegmentedControlOption)[];
    value: any;
    size: 'sm' | 'md' | 'lg';
    fullWidth: boolean;
    disabled: boolean;
    loading: boolean;
    valueChange: EventEmitter<any>;
    private onChange;
    private onTouched;
    get normalizedOptions(): SegmentedControlOption[];
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    selectOption(opt: SegmentedControlOption): void;
    getSizeClasses(): string;
    getContainerSizeClasses(): string;
}
