import { ControlValueAccessor } from '@angular/forms';
import { RatingSize } from '../../../enums/component.enum';
export declare class RatingComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly max: import("@angular/core").InputSignal<number>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | RatingSize>;
    readonly allowClear: import("@angular/core").InputSignal<boolean>;
    readonly readonly: import("@angular/core").InputSignal<boolean>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly ratingChange: import("@angular/core").OutputEmitterRef<number>;
    rating: import("@angular/core").WritableSignal<number>;
    hoverValue: import("@angular/core").WritableSignal<number>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: number) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    readonly stars: import("@angular/core").Signal<number[]>;
    readonly starSize: import("@angular/core").Signal<number>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    setRating(val: number): void;
    onStarHover(val: number): void;
    onMouseLeave(): void;
}
