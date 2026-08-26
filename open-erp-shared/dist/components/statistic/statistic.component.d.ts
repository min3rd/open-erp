import { KpiTrendDirection } from '../../enums/component.enum';
export declare class StatisticComponent {
    readonly title: import("@angular/core").InputSignal<string>;
    readonly value: import("@angular/core").InputSignal<string | number>;
    readonly prefix: import("@angular/core").InputSignal<string | undefined>;
    readonly suffix: import("@angular/core").InputSignal<string | undefined>;
    readonly subText: import("@angular/core").InputSignal<string | undefined>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly iconColor: import("@angular/core").InputSignal<string>;
    readonly iconBg: import("@angular/core").InputSignal<string>;
    readonly trend: import("@angular/core").InputSignal<"neutral" | "up" | "down" | KpiTrendDirection | undefined>;
    readonly trendValue: import("@angular/core").InputSignal<string | undefined>;
    readonly trendLabel: import("@angular/core").InputSignal<string | undefined>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly bordered: import("@angular/core").InputSignal<boolean>;
    readonly isTrendUp: import("@angular/core").Signal<boolean>;
    readonly isTrendDown: import("@angular/core").Signal<boolean>;
}
