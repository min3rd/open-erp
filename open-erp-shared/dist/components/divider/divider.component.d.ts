import { DividerOrientation } from '../../enums/component.enum';
export declare class DividerComponent {
    readonly orientation: import("@angular/core").InputSignal<"horizontal" | "vertical" | DividerOrientation>;
    readonly dashed: import("@angular/core").InputSignal<boolean>;
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly align: import("@angular/core").InputSignal<"left" | "right" | "center">;
    readonly loading: import("@angular/core").InputSignal<boolean>;
}
