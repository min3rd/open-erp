export type IconName = string;
export declare const provideSharedIcons: () => import("@angular/core").EnvironmentProviders;
export declare class IconComponent {
    readonly name: import("@angular/core").InputSignal<string>;
    readonly size: import("@angular/core").InputSignal<string | number>;
    readonly strokeWidth: import("@angular/core").InputSignal<number>;
    readonly className: import("@angular/core").InputSignal<string>;
}
