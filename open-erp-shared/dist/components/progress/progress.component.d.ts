import { ProgressVariant, ProgressStatus } from '../../enums/component.enum';
export declare class ProgressComponent {
    readonly percent: import("@angular/core").InputSignal<number>;
    readonly variant: import("@angular/core").InputSignal<"circle" | "bar" | "dashboard" | ProgressVariant>;
    readonly status: import("@angular/core").InputSignal<"success" | "warning" | "error" | "normal" | "active" | ProgressStatus>;
    readonly showInfo: import("@angular/core").InputSignal<boolean>;
    readonly strokeWidth: import("@angular/core").InputSignal<number>;
    readonly circleSize: import("@angular/core").InputSignal<number>;
    readonly indeterminate: import("@angular/core").InputSignal<boolean>;
    readonly striped: import("@angular/core").InputSignal<boolean>;
    readonly color: import("@angular/core").InputSignal<string | undefined>;
    readonly trackColor: import("@angular/core").InputSignal<string | undefined>;
    readonly normalizedPercent: import("@angular/core").Signal<number>;
    readonly isCircle: import("@angular/core").Signal<boolean>;
    readonly circleRadius: import("@angular/core").Signal<number>;
    readonly circleCircumference: import("@angular/core").Signal<number>;
    readonly circleDashOffset: import("@angular/core").Signal<number>;
    readonly barColorClass: import("@angular/core").Signal<string>;
    readonly circleStrokeColor: import("@angular/core").Signal<string>;
}
