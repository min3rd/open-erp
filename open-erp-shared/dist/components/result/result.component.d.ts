import { ResultStatus } from '../../enums/component.enum';
export declare class ResultComponent {
    readonly status: import("@angular/core").InputSignal<"success" | "warning" | "info" | "error" | "403" | "404" | "500" | ResultStatus>;
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly subTitle: import("@angular/core").InputSignal<string | undefined>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly isHttpError: import("@angular/core").Signal<boolean>;
    readonly defaultTitle: import("@angular/core").Signal<string>;
    readonly defaultSubTitle: import("@angular/core").Signal<string>;
    readonly iconName: import("@angular/core").Signal<string>;
    readonly iconColorClass: import("@angular/core").Signal<string>;
}
