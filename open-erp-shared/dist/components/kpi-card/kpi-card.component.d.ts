import { KpiTrendDirection } from '../../enums/component.enum';
export declare class KpiCardComponent {
    readonly title: import("@angular/core").InputSignal<string>;
    readonly value: import("@angular/core").InputSignal<string | number>;
    readonly subText: import("@angular/core").InputSignal<string>;
    readonly trend: import("@angular/core").InputSignal<"neutral" | "up" | "down" | KpiTrendDirection>;
    readonly iconName: import("@angular/core").InputSignal<string | undefined>;
    readonly iconBg: import("@angular/core").InputSignal<string>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly trendClass: import("@angular/core").Signal<string>;
    readonly trendIcon: import("@angular/core").Signal<string>;
}
