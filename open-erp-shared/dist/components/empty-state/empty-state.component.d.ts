import { EmptyStateType } from '../../enums/component.enum';
export declare class EmptyStateComponent {
    readonly title: import("@angular/core").InputSignal<string>;
    readonly description: import("@angular/core").InputSignal<string>;
    readonly type: import("@angular/core").InputSignal<"no-data" | "not-found" | "error" | "maintenance" | EmptyStateType>;
    readonly customIcon: import("@angular/core").InputSignal<string | undefined>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly iconName: import("@angular/core").Signal<string>;
}
