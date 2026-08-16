import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { RatingSize } from '../../../enums/component.enum';
export declare class RatingComponent implements ControlValueAccessor {
    label?: string;
    max: number;
    size: RatingSize | 'sm' | 'md' | 'lg';
    allowClear: boolean;
    readonly: boolean;
    disabled: boolean;
    loading: boolean;
    ratingChange: EventEmitter<number>;
    rating: import("@angular/core").WritableSignal<number>;
    hoverValue: import("@angular/core").WritableSignal<number>;
    onChange: (val: number) => void;
    onTouched: () => void;
    readonly stars: import("@angular/core").Signal<number[]>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    setRating(val: number): void;
    onStarHover(val: number): void;
    onMouseLeave(): void;
    getStarSize(): number;
}
